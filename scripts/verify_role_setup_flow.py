#!/usr/bin/env python3
import json
import os
import uuid
import mimetypes
from urllib import request, error

BASE_URL = os.environ.get("PRIBEC_API_BASE", "http://localhost:3001/api/v1")


def _json_request(method: str, path: str, payload=None, token: str | None = None):
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    req = request.Request(f"{BASE_URL}{path}", data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")

    try:
        with request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"raw": body}
        raise RuntimeError(f"HTTP {exc.code} {path}: {parsed}") from exc


def _multipart_request(path: str, fields: dict[str, str], files: dict[str, tuple[str, bytes, str]], token: str):
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    body = bytearray()

    for name, value in fields.items():
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode())
        body.extend(f"{value}\r\n".encode())

    for field_name, (filename, content, content_type) in files.items():
        body.extend(f"--{boundary}\r\n".encode())
        body.extend(
            f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode()
        )
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode())
        body.extend(content)
        body.extend(b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode())

    req = request.Request(f"{BASE_URL}{path}", data=bytes(body), method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("Authorization", f"Bearer {token}")

    try:
        with request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"raw": body}
        raise RuntimeError(f"HTTP {exc.code} {path}: {parsed}") from exc


def main():
    suffix = uuid.uuid4().hex[:8]
    email = f"role.setup.{suffix}@example.com"
    password = "Str0ngP@ssw0rd!2026"

    _, reg = _json_request(
        "POST",
        "/auth/register",
        {
            "email": email,
            "password": password,
            "firstName": "Role",
            "lastName": "Setup",
            "role": "agent",
        },
    )

    token = reg["tokens"]["accessToken"]

    business_payload = {
        "companyName": f"Pribec Realty {suffix}",
        "businessType": "Real Estate Agency",
        "licenseNumber": f"LIC-{suffix.upper()}",
        "yearsExperience": "3-5 years",
    }

    _json_request("PATCH", "/users/me", business_payload, token=token)
    _, me = _json_request("GET", "/users/me", token=token)

    business_ok = (
        me.get("companyName") == business_payload["companyName"]
        and me.get("businessType") == business_payload["businessType"]
        and me.get("licenseNumber") == business_payload["licenseNumber"]
        and me.get("yearsExperience") == business_payload["yearsExperience"]
    )

    fake_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"
    files = {
        "id_document": ("id_document.pdf", fake_pdf, mimetypes.guess_type("id_document.pdf")[0] or "application/pdf"),
        "address_proof": ("address_proof.pdf", fake_pdf, mimetypes.guess_type("address_proof.pdf")[0] or "application/pdf"),
        "business_registration": ("business_registration.pdf", fake_pdf, mimetypes.guess_type("business_registration.pdf")[0] or "application/pdf"),
    }

    _, kyc = _multipart_request(
        "/kyc/submit",
        fields={"idDocumentType": "passport"},
        files=files,
        token=token,
    )

    kyc_ok = kyc.get("status") in {"pending", "under_review", "approved", "rejected"}

    result = {
        "api_base": BASE_URL,
        "email": email,
        "business_persisted": business_ok,
        "kyc_submitted": kyc_ok,
        "kyc_status": kyc.get("status"),
    }

    print(json.dumps(result, indent=2))

    if not business_ok:
        raise SystemExit("Business details were not persisted. Ensure migration 202602250003 is applied.")

    if not kyc_ok:
        raise SystemExit("KYC submission did not return expected status.")


if __name__ == "__main__":
    main()

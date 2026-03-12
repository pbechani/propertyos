// Detailed case data for individual case view

export const getCaseDetail = (caseId: string) => {
  const caseDetails: { [key: string]: any } = {
    "CASE-1045": {
      id: "CASE-1045",
      propertyAddress: "123 Oak Street, Springfield",
      propertyType: "Residential",
      buyer: {
        name: "John Smith",
        email: "john.smith@email.com",
        phone: "+1 555-0101",
        id: "CLT-001",
        kycStatus: "Verified",
      },
      seller: {
        name: "Mary Johnson",
        email: "mary.j@email.com",
        phone: "+1 555-0102",
        id: "CLT-002",
        kycStatus: "Pending",
      },
      agent: {
        name: "Robert Williams",
        agency: "Premier Realty",
        phone: "+1 555-0300",
      },
      stage: "Document Collection",
      status: "Delayed",
      progress: 35,
      daysActive: 45,
      assignedTo: "Sarah Williams",
      priority: "High",
      nextDeadline: "2026-03-15",
      purchasePrice: 450000,
      deposit: 45000,
      transferDuty: 22500,
      legalFees: 4500,
      createdDate: "2026-01-25",
      targetCompletionDate: "2026-04-15",

      milestones: [
        {
          id: "M1",
          title: "Sale Agreement Signed",
          status: "Completed",
          completedDate: "2026-01-25",
          dueDate: "2026-01-25",
        },
        {
          id: "M2",
          title: "Document Collection",
          status: "In Progress",
          completedDate: null,
          dueDate: "2026-02-15",
        },
        {
          id: "M3",
          title: "Title Search",
          status: "Pending",
          completedDate: null,
          dueDate: "2026-02-25",
        },
        {
          id: "M4",
          title: "Transfer Documents Prepared",
          status: "Pending",
          completedDate: null,
          dueDate: "2026-03-10",
        },
        {
          id: "M5",
          title: "Registration",
          status: "Pending",
          completedDate: null,
          dueDate: "2026-04-05",
        },
        {
          id: "M6",
          title: "Transfer Complete",
          status: "Pending",
          completedDate: null,
          dueDate: "2026-04-15",
        },
      ],

      tasks: [
        {
          id: "TSK-001",
          title: "Request seller ID document",
          description: "Contact seller to provide government-issued ID",
          assignedTo: "Sarah Williams",
          dueDate: "2026-03-13",
          priority: "High",
          status: "Pending",
          createdDate: "2026-03-10",
        },
        {
          id: "TSK-002",
          title: "Obtain municipal clearance certificate",
          description: "Request clearance certificate from local municipality",
          assignedTo: "Sarah Williams",
          dueDate: "2026-03-15",
          priority: "High",
          status: "Pending",
          createdDate: "2026-03-10",
        },
        {
          id: "TSK-003",
          title: "Verify buyer's bank approval",
          description: "Confirm financing approval from buyer's bank",
          assignedTo: "Sarah Williams",
          dueDate: "2026-03-18",
          priority: "Medium",
          status: "In Progress",
          createdDate: "2026-02-15",
        },
      ],

      documents: [
        {
          id: "DOC-001",
          name: "Sale Agreement",
          type: "Contract",
          uploadDate: "2026-02-15",
          status: "Signed",
          uploadedBy: "John Smith",
          size: "2.4 MB",
          aiAnalysis: "Complete - No issues detected",
        },
        {
          id: "DOC-002",
          name: "Title Deed",
          type: "Title Document",
          uploadDate: "2026-02-18",
          status: "Verified",
          uploadedBy: "Sarah Williams",
          size: "1.8 MB",
          aiAnalysis: "Verified - Ownership confirmed",
        },
        {
          id: "DOC-003",
          name: "Buyer ID - John Smith",
          type: "Identity",
          uploadDate: "2026-02-16",
          status: "Verified",
          uploadedBy: "John Smith",
          size: "856 KB",
          aiAnalysis: "KYC Verified",
        },
      ],

      timeline: [
        {
          id: "E1",
          timestamp: "2026-03-11 10:30",
          type: "alert",
          user: "AI Agent",
          action: "Detected missing documents",
          details: "Seller ID and Municipal Clearance Certificate required",
        },
        {
          id: "E2",
          timestamp: "2026-03-10 14:20",
          type: "communication",
          user: "Sarah Williams",
          action: "Sent reminder email to seller",
          details: "Requested outstanding documents",
        },
        {
          id: "E3",
          timestamp: "2026-03-08 09:15",
          type: "task",
          user: "Sarah Williams",
          action: "Updated case status to Delayed",
          details: "Missing critical documents",
        },
        {
          id: "E4",
          timestamp: "2026-02-18 11:30",
          type: "document",
          user: "Sarah Williams",
          action: "Uploaded Title Deed",
          details: "Document verified by AI",
        },
        {
          id: "E5",
          timestamp: "2026-02-16 16:45",
          type: "document",
          user: "John Smith",
          action: "Uploaded ID document",
          details: "KYC verification passed",
        },
        {
          id: "E6",
          timestamp: "2026-02-15 10:00",
          type: "document",
          user: "John Smith",
          action: "Uploaded Sale Agreement",
          details: "Signed by both parties",
        },
        {
          id: "E7",
          timestamp: "2026-01-25 14:30",
          type: "case",
          user: "Sarah Williams",
          action: "Case created",
          details: "Purchase price: $450,000",
        },
      ],

      aiInsights: [
        {
          type: "warning",
          priority: "High",
          message: "Critical documents missing",
          details:
            "Seller ID and Municipal Clearance Certificate are required to proceed. Case is delayed by 10 days.",
          recommendation:
            "Send urgent follow-up to seller with deadline of March 13, 2026",
          timestamp: "2026-03-11 09:30",
        },
        {
          type: "info",
          priority: "Medium",
          message: "Bank approval pending",
          details:
            "Buyer's bank approval is in progress. Expected completion: March 18, 2026",
          recommendation:
            "Follow up with bank if approval not received by March 16",
          timestamp: "2026-03-10 11:00",
        },
      ],

      communications: [
        {
          id: "COMM-001",
          type: "email",
          from: "Sarah Williams",
          to: "Mary Johnson",
          subject: "Urgent: Missing Documents Required",
          date: "2026-03-10 14:20",
          preview:
            "Dear Mary, We need your ID document and municipal clearance certificate...",
        },
        {
          id: "COMM-002",
          type: "email",
          from: "John Smith",
          to: "Sarah Williams",
          subject: "Bank Approval Status",
          date: "2026-03-08 09:30",
          preview:
            "Hi Sarah, Just checking on the status of my bank approval...",
        },
        {
          id: "COMM-003",
          type: "sms",
          from: "Sarah Williams",
          to: "Mary Johnson",
          subject: "Document reminder",
          date: "2026-03-07 15:45",
          preview:
            "Hi Mary, friendly reminder about the outstanding documents needed...",
        },
      ],

      financials: [
        {
          id: "FIN-001",
          type: "Deposit",
          amount: 45000,
          status: "Received",
          date: "2026-02-01",
          description: "10% deposit received from buyer",
        },
        {
          id: "FIN-002",
          type: "Legal Fees",
          amount: 4500,
          status: "Pending",
          dueDate: "2026-03-20",
          description: "Conveyancing legal fees",
        },
        {
          id: "FIN-003",
          type: "Transfer Duty",
          amount: 22500,
          status: "Pending",
          dueDate: "2026-03-25",
          description: "Government transfer duty",
        },
      ],

      notes: [
        {
          id: "NOTE-001",
          author: "Sarah Williams",
          date: "2026-03-11 10:45",
          content:
            "Spoke with seller - promised to provide ID by March 13. Will follow up if not received.",
          category: "Follow-up",
        },
        {
          id: "NOTE-002",
          author: "Sarah Williams",
          date: "2026-03-08 14:30",
          content:
            "Buyer is anxious about delays. Assured them we're working to expedite the missing documents.",
          category: "Client Communication",
        },
      ],
    },
  };

  return caseDetails[caseId] || null;
};

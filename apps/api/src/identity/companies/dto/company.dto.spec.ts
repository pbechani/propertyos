import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCompanyDto, UpdateCompanyDto } from './company.dto';

describe('CreateCompanyDto – brand_color validation', () => {
  function createDto(overrides: Partial<CreateCompanyDto> = {}) {
    return plainToInstance(CreateCompanyDto, {
      name: 'Test Co',
      category: 'agent',
      email: 'test@co.com',
      ...overrides,
    });
  }

  it('accepts a valid 7-char hex colour', async () => {
    const dto = createDto({ brand_color: '#4A9E8E' });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'brand_color')).toHaveLength(0);
  });

  it('accepts lowercase hex colour', async () => {
    const dto = createDto({ brand_color: '#ff5733' });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'brand_color')).toHaveLength(0);
  });

  it('rejects hex without leading #', async () => {
    const dto = createDto({ brand_color: '4A9E8E' });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'brand_color')).toHaveLength(1);
  });

  it('rejects 3-char shorthand hex', async () => {
    const dto = createDto({ brand_color: '#FFF' });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'brand_color')).toHaveLength(1);
  });

  it('rejects random string', async () => {
    const dto = createDto({ brand_color: 'red' });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'brand_color')).toHaveLength(1);
  });

  it('allows brand_color to be omitted', async () => {
    const dto = createDto();
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'brand_color')).toHaveLength(0);
  });
});

describe('UpdateCompanyDto – brand_color validation', () => {
  function updateDto(overrides: Partial<UpdateCompanyDto> = {}) {
    return plainToInstance(UpdateCompanyDto, overrides);
  }

  it('accepts a valid hex colour', async () => {
    const dto = updateDto({ brand_color: '#000000' });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'brand_color')).toHaveLength(0);
  });

  it('rejects invalid hex colour', async () => {
    const dto = updateDto({ brand_color: '#ZZZZZZ' });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'brand_color')).toHaveLength(1);
  });

  it('allows brand_color to be omitted', async () => {
    const dto = updateDto({ name: 'Updated Name' });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'brand_color')).toHaveLength(0);
  });
});

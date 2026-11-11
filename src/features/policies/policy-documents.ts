import { ROUTES } from '../../constants/routes';

export const POLICY_DOCUMENTS = [
  { code: 'BOOKING_GUIDE', slug: 'huong-dan-dat-tour', label: 'Hướng dẫn đặt tour' },
  { code: 'REFUND_POLICY', slug: 'chinh-sach-hoan-huy', label: 'Chính sách hoàn huỷ' },
  { code: 'WEBSITE_TERMS', slug: 'dieu-khoan-website', label: 'Điều khoản website' },
  { code: 'PRIVACY_POLICY', slug: 'chinh-sach-bao-mat', label: 'Chính sách bảo mật' },
  { code: 'LIABILITY_WAIVER', slug: 'phieu-mien-tru-trach-nhiem', label: 'Phiếu miễn trừ trách nhiệm' },
] as const;

export type PolicyDocument = (typeof POLICY_DOCUMENTS)[number];

export const policyDocumentPath = (document: PolicyDocument) => ROUTES.PUBLIC.POLICY(document.slug);

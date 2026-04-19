// Authentication Endpoints
export const AUTH_ENDPOINTS = {
        REGISTER: `/api/v1/auth/register`,
        LOGIN: `/api/v1/auth/login`,
        VERIFYOTP: `/api/v1/auth/verify-otp`,
        GETUSER: `/api/v1/auth/me`,
} as const;



export const PATIENTS_ENDPOINTS = {
        UPDATE_PROFILE: `/api/v1/patients`,
} as const;

export const DOCTORS_ENDPOINTS = {
        UPDATE_PROFILE: `/api/v1/doctors`,
        ADD_SCHEDULE: `/api/v1/doctors/avaliablity`,
        SCHEDULE_LIST: `/api/v1/doctors/avaliablity/get-avaliablity`,
} as const;

export const ADMIN_ENDPOINTS = {
        GET_ALL_DOCTORS: `/api/v1/admin/get-doctors`,
        GET_DOCTOR_BY_ID: (doctorId: string) => `/api/v1/admin/get-doctors/${doctorId}`,
        VERIFY_DOCTOR: `/api/v1/admin/verify-doctors`,
} as const;
const API_ENDPOINTS = {
        AUTH: AUTH_ENDPOINTS,
        PATIENTS: PATIENTS_ENDPOINTS,
        DOCTORS: DOCTORS_ENDPOINTS,
        ADMIN: ADMIN_ENDPOINTS,
} as const;

export default API_ENDPOINTS;
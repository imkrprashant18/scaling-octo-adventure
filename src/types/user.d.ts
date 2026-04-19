
export interface LoginResponse {
        message: string;
        user: User;
        accessToken: string;
        refreshToken: string;
}

export interface RegisterInput {
        name?: string;
        email: string;
        password: string;
}

export interface VerifyOtpInput {
        email: string;
        otp: string;
}



export interface ApiResponse<T> {
        statusCode: number;
        data: T;

        message: string;
        success: boolean;
}
export type UserRole = "UNASSIGNED" | "PATIENT" | "DOCTOR" | "ADMIN";

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        isActive: boolean;
        emailVerified: boolean;

        specialty: string | null;
        experience: number | null;
        description: string | null;
        opdFee: number | null;
        credentialUrl: string | null;

        avatar: string | null;
        phone: string | null;
        address: string | null;

        verificationStatus: VerificationStatus;

        createdAt: string;
        updatedAt: string;
}

export type Doctor = {
        id: string;
        name: string;
        email: string;
        specialty: string;
        experience: number;
        description: string;
        avatar: string;
        gender: "MALE" | "FEMALE";
        dob: string;
        phone: string;
        address: string;
        opdFee: number;
        verificationStatus: string;
        isActive: boolean;
};
export type GetUserResponse = ApiResponse<User>;


export interface Doctor {
        id: string;
        name: string;
        email: string;
        specialty: string;
        experience: number;
        description: string;
        avatar: string;
        gender: "MALE" | "FEMALE";
        dob: string;
        phone: string;
        address: string;
        opdFee: number;
        verificationStatus: string;
        isActive: boolean;
};

export type DoctorsResponse = {
        data: {
                data: Doctor[];
                meta: {
                        total: number;
                        limit: number;
                        nextCursor: string | null;
                        hasNextPage: boolean;
                };
        };
};

export interface PatientFormData {
        phone: string;
        gender: string;
        address: string;
        avatar: string;
        dob: string;
        userId?: string;
}
export interface DoctorFormData {
        opdFee: number;
        specialty: string;
        experience: number;
        description: string;
        phone: string;
        gender: string;
        address: string;
        avatar: string;
        credentialUrl: string;
        dob: string;
        userId?: string;
}

export type UploadFile = {
        uri: string;
        name: string;
        type: string;
};
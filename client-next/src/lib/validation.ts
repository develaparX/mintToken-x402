import { NextResponse } from 'next/server';

export interface ValidationError {
    field: string;
    message: string;
}

export class ValidationResult {
    public errors: ValidationError[] = [];

    addError(field: string, message: string): void {
        this.errors.push({ field, message });
    }

    isValid(): boolean {
        return this.errors.length === 0;
    }

    getErrorResponse(): NextResponse {
        return NextResponse.json(
            {
                success: false,
                message: 'Validation failed',
                errors: this.errors,
            },
            { status: 400 }
        );
    }
}

export function validateAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function validateAmount(amount: number, min: number = 1, max: number = Number.MAX_SAFE_INTEGER): boolean {
    return Number.isInteger(amount) && amount >= min && amount <= max;
}

export function validateTxHash(txHash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(txHash);
}

export function validateMintRequest(body: any): ValidationResult {
    const result = new ValidationResult();

    if (!body.to) {
        result.addError('to', 'Recipient address is required');
    } else if (!validateAddress(body.to)) {
        result.addError('to', 'Invalid recipient address format');
    }

    if (body.amount === undefined || body.amount === null) {
        result.addError('amount', 'Amount is required');
    } else if (!validateAmount(body.amount, 1)) {
        result.addError('amount', 'Amount must be a positive integer');
    }

    return result;
}

export function validateBatchRequest(body: any): ValidationResult {
    const result = new ValidationResult();

    if (!body.recipients) {
        result.addError('recipients', 'Recipients array is required');
        return result;
    }

    if (!Array.isArray(body.recipients)) {
        result.addError('recipients', 'Recipients must be an array');
        return result;
    }

    if (body.recipients.length === 0) {
        result.addError('recipients', 'Recipients array cannot be empty');
        return result;
    }

    if (body.recipients.length > 100) {
        result.addError('recipients', 'Maximum 100 recipients per batch');
        return result;
    }

    body.recipients.forEach((recipient: any, index: number) => {
        if (!recipient.to) {
            result.addError(`recipients[${index}].to`, 'Recipient address is required');
        } else if (!validateAddress(recipient.to)) {
            result.addError(`recipients[${index}].to`, 'Invalid recipient address format');
        }

        if (recipient.amount === undefined || recipient.amount === null) {
            result.addError(`recipients[${index}].amount`, 'Amount is required');
        } else if (!validateAmount(recipient.amount, 1, 1000)) {
            result.addError(`recipients[${index}].amount`, 'Amount must be between 1 and 1,000 tokens');
        }
    });

    return result;
}

export function createErrorResponse(message: string, status: number = 500, details?: any): NextResponse {
    return NextResponse.json(
        {
            success: false,
            message,
            ...(details && { details }),
            timestamp: new Date().toISOString(),
        },
        { status }
    );
}

export function createSuccessResponse(data: any, message?: string): NextResponse {
    return NextResponse.json({
        success: true,
        ...(message && { message }),
        data,
        timestamp: new Date().toISOString(),
    });
}
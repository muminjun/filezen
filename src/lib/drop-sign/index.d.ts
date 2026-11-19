type DropSignTarget = string | HTMLElement;
type DropSignTrigger = {
    type: 'global';
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    label?: string;
} | {
    type: 'custom';
    element: string | HTMLElement;
};
interface DropSignMessages {
    sign?: string;
    clear?: string;
    cancel?: string;
    useSignature?: string;
    confirm?: string;
    delete?: string;
    signingTitle?: string;
    signingDescription?: string;
    emptySignatureHint?: string;
}
interface DropSignSignatureOptions {
    penColor?: string;
    minWidth?: number;
    maxWidth?: number;
    velocityFilterWeight?: number;
}
interface NormalizedPlacement {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface DropSignResult {
    signatureDataUrl: string;
    signatureBlob: Blob;
    placement: NormalizedPlacement;
}
interface DropSignOptions {
    target?: DropSignTarget;
    trigger?: DropSignTrigger;
    messages?: DropSignMessages;
    signature?: DropSignSignatureOptions;
    onComplete?: (result: DropSignResult) => void | Promise<void>;
    onCancel?: () => void;
    onError?: (error: unknown) => void;
}
interface DropSignWidget {
    destroy(): void;
}

declare class DropSign {
    static init(options: DropSignOptions): DropSignWidget;
}

export { DropSign, type DropSignMessages, type DropSignOptions, type DropSignResult, type DropSignSignatureOptions, type DropSignTarget, type DropSignTrigger, type DropSignWidget, type NormalizedPlacement };

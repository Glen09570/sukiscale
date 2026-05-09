declare module 'react-native-bluetooth-escpos-printer' {
  export class BluetoothManager {
    static isBluetoothEnabled(): Promise<boolean>;
    static enableBluetooth(): Promise<string[]>;
    static disableBluetooth(): Promise<void>;
    static scanDevices(): Promise<string>;
    static connect(address: string): Promise<void>;
    static unpair(address: string): Promise<void>;
    static EVENT_DEVICE_ALREADY_PAIRED: string;
    static EVENT_DEVICE_FOUND: string;
    static EVENT_CONNECTION_LOST: string;
  }

  export class BluetoothEscposPrinter {
    static ALIGN: { LEFT: number; CENTER: number; RIGHT: number };
    static printerInit(): void;
    static printAndFeed(feed: number): void;
    static printerLeftSpace(sp: number): void;
    static printerLineSpace(sp: number): void;
    static printerUnderLine(line: number): void;
    static printerAlign(align: number): void;
    static printText(text: string, options?: any): void;
    static printColumn(columnWidths: number[], columnAligns: number[], columnTexts: string[], options?: any): void;
    static setWidth(width: number): void;
    static printPic(base64encodeStr: string, options?: any): void;
    static setfTest(): void;
    static rotate(): void;
    static setBlob(weight: number): void;
    static printQRCode(content: string, size: number, correctionLevel: number): void;
    static printBarCode(str: string, nType: number, nWidthX: number, nHeight: number, nHriFontType: number, nHriFontPosition: number): void;
  }

  export class BluetoothTscPrinter {
    static DIRECTION: { FORWARD: number; BACKWARD: number };
    static TEAR: { ON: number; OFF: number };
    static FONTTYPE: { SIMPLIFIED_CHINESE: number; TRADITIONAL_CHINESE: number };
    static ROTATION: { ROTATION_0: number; ROTATION_90: number; ROTATION_180: number; ROTATION_270: number };
    static FONTMUL: { MUL_1: number; MUL_2: number; MUL_3: number; MUL_4: number; MUL_5: number; MUL_6: number; MUL_7: number; MUL_8: number };
    static BITMAP_MODE: { OVERWRITE: number; OR: number; XOR: number };
    static EEC: { LEVEL_L: number; LEVEL_M: number; LEVEL_Q: number; LEVEL_H: number };
    static BARCODETYPE: { UPC_A: number; UPC_E: number; EAN13: number; EAN8: number; CODE39: number; ITF: number; CODABAR: number; CODE93: number; CODE128: number };
  }
}

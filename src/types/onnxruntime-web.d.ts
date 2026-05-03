// Type shim for onnxruntime-web — package.json "exports" lacks a "types" field
// so TypeScript (moduleResolution: bundler) cannot auto-resolve types.d.ts.
declare module 'onnxruntime-web' {
  export * from 'onnxruntime-common';
}

declare module 'onnxruntime-web/all' {
  export * from 'onnxruntime-web';
}

declare module 'onnxruntime-web/wasm' {
  export * from 'onnxruntime-web';
}

declare module 'onnxruntime-web/webgl' {
  export * from 'onnxruntime-web';
}

declare module 'onnxruntime-web/webgpu' {
  export * from 'onnxruntime-web';
}

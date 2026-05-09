import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastPayload {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);
  const timeoutMapRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

    const timeout = timeoutMapRef.current[id];
    if (timeout) {
      clearTimeout(timeout);
      delete timeoutMapRef.current[id];
    }
  }, []);

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setToasts((prev) => [...prev, { id, title, message, type }]);

    timeoutMapRef.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      delete timeoutMapRef.current[id];
    }, 2800);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={[styles.viewport, { pointerEvents: 'box-none' }]}>
        {toasts.map((toast) => {
          const toastStyle = toast.type === 'error'
            ? styles.errorToast
            : toast.type === 'info'
              ? styles.infoToast
              : styles.successToast;

          return (
            <Pressable
              key={toast.id}
              onPress={() => dismissToast(toast.id)}
              style={[styles.toast, toastStyle]}
            >
              <Text style={styles.toastTitle}>{toast.title}</Text>
              {toast.message ? <Text style={styles.toastMessage}>{toast.message}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 12,
    right: Platform.OS === 'web' ? 20 : 12,
    left: Platform.OS === 'web' ? undefined : 12,
    zIndex: 1000,
    gap: 10,
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'stretch',
  },
  toast: {
    width: Platform.OS === 'web' ? 320 : '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 6,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.16)',
    } as any),
  },
  successToast: {
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
  },
  errorToast: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
  },
  infoToast: {
    backgroundColor: '#EFF8FF',
    borderColor: '#B2DDFF',
  },
  toastTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  toastMessage: {
    color: '#334155',
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
});

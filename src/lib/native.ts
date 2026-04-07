import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'

// Detecta se está rodando como app nativo
export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() // 'ios' | 'android' | 'web'

// Haptic feedback nativo (melhor que vibrate do navegador)
export async function hapticLight() {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Light })
  } else {
    navigator.vibrate?.(10)
  }
}

export async function hapticMedium() {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Medium })
  } else {
    navigator.vibrate?.(20)
  }
}

export async function hapticHeavy() {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Heavy })
  } else {
    navigator.vibrate?.(30)
  }
}

// Status bar
export async function setStatusBarLight() {
  if (isNative) {
    await StatusBar.setStyle({ style: Style.Light })
    if (platform === 'android') {
      await StatusBar.setBackgroundColor({ color: '#fff4f6' })
    }
  }
}

export async function setStatusBarDark() {
  if (isNative) {
    await StatusBar.setStyle({ style: Style.Dark })
    if (platform === 'android') {
      await StatusBar.setBackgroundColor({ color: '#0f172a' })
    }
  }
}

// Deep links e back button
export function setupAppListeners(onBackButton?: () => void) {
  if (!isNative) return

  // Back button no Android
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else if (onBackButton) {
      onBackButton()
    } else {
      App.exitApp()
    }
  })

  // App voltando do background
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      console.log('App voltou ao primeiro plano')
      // Pode fazer refresh de dados aqui
    }
  })
}

// Esconde a splash screen (chamar depois do app carregar)
export async function hideSplash() {
  if (isNative) {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  }
}

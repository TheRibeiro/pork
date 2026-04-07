# Guia: BolsoCheio no iOS e Android

## Estrutura Atual

```
BolsoCheio/
├── ios/              ← Projeto Xcode (iOS)
├── android/          ← Projeto Android Studio
├── dist/             ← Build web (copiado para apps)
├── capacitor.config.ts
└── ...
```

## Pré-requisitos

### Para iOS (precisa de Mac)
- macOS Monterey ou superior
- Xcode 14+ (baixar na App Store)
- Conta Apple Developer ($99/ano para publicar)
- CocoaPods: `sudo gem install cocoapods`

### Para Android (funciona no Windows)
- Android Studio (https://developer.android.com/studio)
- Java JDK 17+
- Android SDK (instala com Android Studio)

---

## Workflow de Desenvolvimento

### 1. Fazer alterações no código React
```bash
# Editar arquivos em src/
# O hot reload funciona normalmente com `npm run dev`
```

### 2. Build e Sync para mobile
```bash
# Build do React + sync para iOS/Android
npm run build
npx cap sync

# Ou atalhos:
npm run ios       # Build + abre Xcode
npm run android   # Build + abre Android Studio
```

### 3. Testar no simulador/emulador

#### iOS (apenas Mac)
```bash
npm run ios       # Abre Xcode
# No Xcode: selecione um simulador e clique Play (▶)
```

#### Android
```bash
npm run android   # Abre Android Studio
# No Android Studio: selecione um emulador e clique Run
```

### 4. Testar em dispositivo físico

#### iOS (dispositivo conectado ao Mac)
1. Conecte o iPhone via cabo
2. No Xcode, selecione seu dispositivo no dropdown
3. Pode pedir para "Confiar" no dispositivo
4. Clique Play (▶)

#### Android (dispositivo conectado)
1. Ative "Opções de desenvolvedor" no celular
2. Ative "Depuração USB"
3. Conecte via cabo USB
4. No Android Studio, selecione seu dispositivo
5. Clique Run

---

## Publicar na App Store (iOS)

### 1. Configurar no Xcode
1. Abra `ios/App/App.xcworkspace`
2. Selecione "App" no navigator
3. Na aba "Signing & Capabilities":
   - Selecione seu Team (conta Apple Developer)
   - Bundle ID: `com.bolsocheio.app`
4. Na aba "General":
   - Version: 1.0.0
   - Build: 1

### 2. Criar Archive
1. Menu: Product → Archive
2. Aguarde o build
3. No Organizer, clique "Distribute App"
4. Escolha "App Store Connect"
5. Siga os passos

### 3. No App Store Connect
1. Acesse https://appstoreconnect.apple.com
2. Crie um novo app
3. Preencha informações, screenshots, descrição
4. Envie para revisão

---

## Publicar na Play Store (Android)

### 1. Gerar AAB (Android App Bundle)
```bash
cd android
./gradlew bundleRelease
```
O arquivo fica em: `android/app/build/outputs/bundle/release/app-release.aab`

### 2. Assinar o app
1. No Android Studio: Build → Generate Signed Bundle
2. Crie ou use uma keystore existente
3. Guarde a keystore em local seguro!

### 3. No Google Play Console
1. Acesse https://play.google.com/console
2. Crie conta de desenvolvedor ($25 único)
3. Crie um novo app
4. Upload do AAB
5. Preencha informações, screenshots
6. Envie para revisão

---

## Gerar Ícones e Splash Screen

### Opção 1: Ferramenta online
1. Use https://capacitorjs.com/docs/guides/splash-screens-and-icons
2. Ou https://www.appicon.co/

### Opção 2: Cordova-res (automatizado)
```bash
npm install -g cordova-res

# Coloque imagens base em:
# resources/icon.png (1024x1024)
# resources/splash.png (2732x2732)

cordova-res ios --skip-config --copy
cordova-res android --skip-config --copy
```

### Tamanhos necessários para iOS
- icon-20.png (20x20)
- icon-20@2x.png (40x40)
- icon-20@3x.png (60x60)
- icon-29.png (29x29)
- icon-29@2x.png (58x58)
- icon-29@3x.png (87x87)
- icon-40.png (40x40)
- icon-40@2x.png (80x80)
- icon-40@3x.png (120x120)
- icon-60@2x.png (120x120)
- icon-60@3x.png (180x180)
- icon-76.png (76x76)
- icon-76@2x.png (152x152)
- icon-83.5@2x.png (167x167)
- icon-1024.png (1024x1024)

---

## Debug e Logs

### iOS
```bash
# Ver logs do Safari
# 1. No iPhone: Ajustes → Safari → Avançado → Web Inspector ON
# 2. No Mac: Safari → Develop → [seu dispositivo] → BolsoCheio
```

### Android
```bash
# Ver logs no terminal
npx cap run android --target [device-id]

# Ou no Android Studio: View → Tool Windows → Logcat
```

---

## Troubleshooting

### "No provisioning profile" (iOS)
- Verifique se está logado na conta Apple Developer no Xcode
- Verifique se o Bundle ID está correto

### App não abre / tela branca
```bash
# Limpe e rebuild
rm -rf ios/App/App/public
rm -rf android/app/src/main/assets/public
npm run build
npx cap sync
```

### Plugins não funcionam
```bash
npx cap sync
# Rebuild no Xcode/Android Studio
```

---

## Comandos Úteis

```bash
# Sync após mudanças
npx cap sync

# Abrir projetos nativos
npx cap open ios
npx cap open android

# Rodar diretamente (sem abrir IDE)
npx cap run ios
npx cap run android

# Listar dispositivos disponíveis
npx cap run ios --list
npx cap run android --list

# Live reload (desenvolvimento)
# No capacitor.config.ts, descomente a URL do server
# E rode: npm run dev
```

---

## Próximos Passos Recomendados

1. **Gerar ícones** com o porquinho em todas as resoluções
2. **Testar em emulador** Android (funciona no Windows)
3. **Se tiver Mac**: testar no simulador iOS
4. **Preparar screenshots** para as lojas
5. **Escrever descrição** do app para as lojas

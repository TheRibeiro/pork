import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { vibrate } from '../lib/utils'
import { SupervisionDashboard } from './SupervisionDashboard'
import { FamilySection } from '../components/family/FamilySection'

export function Settings() {
  const { user, signOut } = useAuth()
  const { settings, updateSettings, activeChildId, setActiveChildId } = useApp()
  const { children } = settings

  const activeChild = activeChildId ? children.find(c => c.id === activeChildId) : null
  const userName = activeChild ? activeChild.name : (user?.email?.split('@')[0] || 'Guardião')

  const [showAddChild, setShowAddChild] = useState(false)
  const [newChildName, setNewChildName] = useState('')
  const [generatedPin, setGeneratedPin] = useState<string | null>(null)
  const [viewingChildId, setViewingChildId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Polling para detectar quando a criança digitou o código no outro celular
  useEffect(() => {
    if (!generatedPin || !user) return
    setIsConnected(false)

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('children')
        .eq('id', user.id)
        .single()

      if (data && data.children) {
        const match = data.children.find((c: { pin: string; is_connected?: boolean }) => c.pin === generatedPin)
        if (match && match.is_connected) {
          setIsConnected(true)
          updateSettings({ children: data.children })
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [generatedPin, user, updateSettings])

  function handleAddChild() {
    if (!newChildName) {
      vibrate([50, 50, 50])
      alert('Preencha o nome!')
      return
    }
    const code = 'GP-' + Math.floor(1000 + Math.random() * 9000).toString()

    updateSettings({
      children: [
        ...children,
        {
          id: uuidv4(),
          name: newChildName,
          pin: code,
          pin_expires_at: Date.now() + 24 * 60 * 60 * 1000,
          allowance: 0,
          is_connected: false
        }
      ]
    })

    setGeneratedPin(code)
    vibrate(100)
  }

  function handleCloseModal() {
    setNewChildName('')
    setGeneratedPin(null)
    setShowAddChild(false)
    setIsConnected(false)
  }

  function handleGenerateNewPin(childId: string) {
    const code = 'GP-' + Math.floor(1000 + Math.random() * 9000).toString()
    const updated = children.map(c =>
      c.id === childId
        ? { ...c, pin: code, pin_expires_at: Date.now() + 24 * 60 * 60 * 1000 }
        : c
    )
    updateSettings({ children: updated })
    vibrate(20)
    alert(`Novo código gerado válido por 24h: ${code}`)
  }

  if (viewingChildId) {
    return <SupervisionDashboard childId={viewingChildId} onBack={() => setViewingChildId(null)} />
  }

  return (
    <div className="min-h-screen pb-32 font-body text-on-surface bg-background">
      {/* Top App Bar */}
      <header className="w-full top-0 sticky z-50 bg-[#fff4f6]/95 backdrop-blur-md shadow-[0_20px_40px_rgba(119,81,89,0.08)] flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
            <span className="text-2xl">🐷</span>
          </div>
          <h1 className="font-headline font-bold text-lg text-[#775159]">Cofre do Porquinho</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-8 space-y-12">

        {/* Profile Header */}
        <section className="flex flex-col items-center text-center space-y-4">
          <div className="relative group cursor-pointer">
            <div className="w-32 h-32 rounded-full bg-surface-container-highest border-[6px] border-white shadow-[0_10px_30px_rgba(119,81,89,0.15)] flex items-center justify-center overflow-hidden">
              <span className="text-6xl uppercase text-primary font-headline font-black">
                {userName.charAt(0)}
              </span>
            </div>
            {!activeChild && (
              <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary px-4 py-1 rounded-full font-headline font-extrabold italic text-sm shadow-lg rotate-6">
                GUARDIÃO
              </div>
            )}
          </div>
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight capitalize">{userName}</h2>
          </div>
        </section>

        {/* ── SEÇÃO FAMÍLIA (novo sistema) ── */}
        {!activeChild && <FamilySection />}

        {/* ── AVENTUREIROS (sistema legado - filhos locais) ── */}
        {!activeChild && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-xl px-2">Aventureiros (Supervisão)</h3>
              <span className="w-12 h-1 bg-tertiary-container rounded-full" />
            </div>

            <div className="bg-surface-container p-6 rounded-xl shadow-[inset_0_2px_10px_rgba(119,81,89,0.05)] space-y-4">
              {children.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">Nenhuma missão ativa. Adicione um herói!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {children.map(child => (
                    <div
                      key={child.id}
                      onClick={() => { vibrate(10); setViewingChildId(child.id) }}
                      className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-3 group hover:scale-105 hover:shadow-md cursor-pointer transition-all duration-300"
                    >
                      <div className="flex justify-between items-start w-full">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary-container rounded-full flex justify-center items-center overflow-hidden border-2 border-white shadow-sm">
                            <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-on-surface capitalize">{child.name}</p>
                            <p className={`text-[10px] font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-1 ${child.is_connected ? 'bg-secondary-container text-secondary' : 'bg-outline-variant/30 text-on-surface-variant'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${child.is_connected ? 'bg-secondary animate-pulse' : 'bg-on-surface-variant'}`} />
                              {child.is_connected ? 'Em Missão' : 'Aguardando Código'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleGenerateNewPin(child.id) }}
                          className="text-tertiary hover:opacity-70 p-1"
                          title="Gerar Novo Código de Acesso"
                        >
                          <span className="material-symbols-outlined text-sm">key</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowAddChild(true)}
                className="w-full py-4 border-2 border-dashed border-primary/30 rounded-xl text-primary font-bold hover:bg-primary-container/30 transition-colors flex justify-center items-center gap-2 mt-4"
              >
                <span className="material-symbols-outlined">explore</span>
                Convocar Novo Aventureiro
              </button>

              <div className="pt-4 border-t border-outline-variant/20 mt-4">
                <p className="text-xs text-on-surface-variant mb-2">PIN Fixo do Guardião (Exigido ao voltar da conta da criança)</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="S/ PIN"
                    value={settings.parentPin || ''}
                    onChange={(e) => updateSettings({ parentPin: e.target.value.replace(/\D/g, '') || null })}
                    className="w-32 bg-white p-3 rounded-lg border-none focus:ring-2 focus:ring-primary shadow-sm tracking-widest font-bold text-center text-primary"
                  />
                  <div className="text-[10px] text-on-surface-variant flex items-center px-2">Gravado Instantaneamente</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Modal de Convite de Aventureiro */}
        {showAddChild && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#faf3e0] border-4 border-[#c29668] p-6 rounded-sm shadow-2xl relative">
              <div className="text-center mb-6">
                <h3 className="font-headline font-extrabold text-[#7d532a] text-2xl uppercase tracking-widest">Convocar Herói</h3>
                <div className="w-24 h-1 bg-[#c29668] mx-auto mt-2" />
              </div>

              {!generatedPin ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[#7d532a] font-bold text-sm">Nome do Aventureiro</label>
                    <input
                      type="text"
                      value={newChildName}
                      onChange={e => setNewChildName(e.target.value)}
                      className="w-full bg-[#fdfaf2] p-3 border-2 border-[#dabd9c] outline-none text-[#7d532a] font-bold font-headline rounded shadow-inner"
                      placeholder="Ex: Leo"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={handleCloseModal} className="flex-1 py-3 text-[#7d532a] font-bold hover:bg-[#dabd9c]/30 rounded transition-colors">Cancelar</button>
                    <button onClick={handleAddChild} className="flex-1 py-3 bg-[#7d532a] text-[#faf3e0] font-bold shadow-md active:translate-y-1 rounded uppercase tracking-wider">Aprovar</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <p className="text-[#7d532a] font-medium text-sm">O chamado foi escrito! Entregue este código ao aventureiro:</p>
                  <div className="bg-[#fdfaf2] border-2 border-dashed border-[#dabd9c] p-4 flex items-center justify-center shadow-inner">
                    <span className="font-headline font-black text-4xl text-[#bf360c] tracking-widest">{generatedPin}</span>
                  </div>

                  <div className="text-left bg-[#dabd9c]/20 p-4 rounded text-xs space-y-2 text-[#7d532a]">
                    <p className="font-bold uppercase tracking-wider mb-2">🗺️ Como iniciar a jornada:</p>
                    <p>1. Baixe "O PORQUIN" no celular de <b className="capitalize">{newChildName}</b>.</p>
                    <p>2. Na tela inicial, selecione "Sou Aventureiro".</p>
                    <p>3. Digite o código gerado acima para conectar a conta.</p>
                  </div>

                  {!isConnected ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="w-8 h-8 rounded-full border-4 border-[#dabd9c]/30 border-t-[#c29668] animate-spin" />
                      <p className="text-xs font-bold text-[#c29668] uppercase tracking-wider animate-pulse pt-2">Aguardando Conexão...</p>
                      <button onClick={handleCloseModal} className="text-[10px] text-[#c29668] underline mt-2 hover:text-[#7d532a]">Sair (Deixar aguardando em 2º plano)</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="bg-[#e6f4ea] text-[#137333] p-3 rounded font-bold uppercase tracking-wider text-sm flex justify-center items-center gap-2">
                        <span className="material-symbols-outlined">verified</span>
                        Aventureiro Conectado!
                      </div>
                      <button onClick={handleCloseModal} className="w-full py-3 bg-[#7d532a] text-[#faf3e0] font-bold shadow-md active:translate-y-1 rounded uppercase tracking-wider">
                        Concluir Missão
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preferências */}
        <section className="bg-surface-container rounded-xl p-8 space-y-8 shadow-[inset_0_2px_10px_rgba(119,81,89,0.05)]">
          <h3 className="font-headline font-bold text-xl">Preferências do App</h3>
          <div className="flex flex-col gap-6">
            <div
              className="flex items-center justify-between p-4 bg-white rounded-[2rem] shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container">light_mode</span>
                </div>
                <span className="font-bold">Tema Noturno</span>
              </div>
              <div className="flex bg-surface-container p-1 rounded-full w-24 sm:w-32 relative transition-all">
                <div className={`w-1/2 h-8 bg-white rounded-full shadow-sm flex items-center justify-center transition-transform ${settings.theme === 'dark' ? 'translate-x-full' : 'translate-x-0'}`}>
                  <span className="material-symbols-outlined text-sm">{settings.theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="pt-8 flex flex-col items-center gap-4">
          <button
            onClick={() => {
              vibrate(20)
              setActiveChildId(null)
              window.location.reload()
            }}
            className="w-full py-5 bg-surface-container-highest text-on-surface font-headline font-extrabold text-xl rounded-full shadow-md flex items-center justify-center gap-3 active:scale-95 transition-all outline-none"
          >
            <span className="material-symbols-outlined">vpn_key</span>
            Fazer Novo Login (Trocar)
          </button>

          {!activeChild && (
            <button
              onClick={signOut}
              className="w-full py-5 bg-error/10 text-error font-headline font-bold text-lg rounded-full shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all outline-none border border-error/20"
            >
              <span className="material-symbols-outlined">logout</span>
              Desconectar Dispositivo
            </button>
          )}

          <p className="mt-8 text-on-surface-variant/50 font-bold text-[10px] uppercase tracking-widest">
            O Porquin v4.1 (Família)
          </p>
        </div>
      </main>
    </div>
  )
}

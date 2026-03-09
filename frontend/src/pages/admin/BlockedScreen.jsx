import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

/**
 * BlockedScreen
 * Shown to managers whose account status = 'blocked'.
 * They can still log in but cannot perform any operation.
 * The message pulsates: shown for 4s, hidden for 2s, then repeats.
 */
function BlockedScreen() {
    const { user, logout } = useContext(AuthContext);
    const [visible, setVisible] = useState(true);
    const [pulse, setPulse] = useState(false);

    // Message cycle: show 4s → hide 2s → show again
    useEffect(() => {
        let showTimer, hideTimer;
        const cycle = () => {
            setVisible(true);
            setPulse(true);
            showTimer = setTimeout(() => {
                setPulse(false);
                setVisible(false);
                hideTimer = setTimeout(cycle, 2000);
            }, 4000);
        };
        cycle();
        return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background glow blobs */}
            <div style={{
                position: 'absolute', top: '15%', left: '20%',
                width: '300px', height: '300px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.08)', filter: 'blur(80px)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', bottom: '20%', right: '15%',
                width: '250px', height: '250px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.06)', filter: 'blur(80px)',
                pointerEvents: 'none'
            }} />

            {/* Card */}
            <div style={{
                maxWidth: '480px', width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '24px',
                padding: '3rem 2.5rem',
                textAlign: 'center',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 0 60px rgba(239,68,68,0.12), 0 20px 60px rgba(0,0,0,0.5)',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Animated lock icon */}
                <div style={{
                    width: '90px', height: '90px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,rgba(239,68,68,0.2),rgba(239,68,68,0.1))',
                    border: '2px solid rgba(239,68,68,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    animation: pulse ? 'blockPulse 1s ease-in-out infinite' : 'none'
                }}>
                    <span style={{ fontSize: '2.5rem' }}>🚫</span>
                </div>

                {/* Message – fades in/out */}
                <div style={{
                    transition: 'opacity 0.6s ease, transform 0.6s ease',
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(8px)'
                }}>
                    <h1 style={{
                        margin: '0 0 0.5rem',
                        fontSize: '1.8rem',
                        fontWeight: '800',
                        color: '#ef4444',
                        letterSpacing: '-0.02em'
                    }}>
                        Account Suspended
                    </h1>
                    <p style={{
                        fontSize: '1rem', color: 'rgba(255,255,255,0.6)',
                        lineHeight: '1.6', margin: '0 0 0.25rem'
                    }}>
                        Hello <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{user?.name}</strong>,
                    </p>
                    <p style={{
                        fontSize: '0.95rem', color: 'rgba(255,255,255,0.55)',
                        lineHeight: '1.6', margin: '0 0 2rem'
                    }}>
                        Your manager account has been <strong style={{ color: '#ef4444' }}>blocked</strong> by the administrator.
                        You are logged in but <strong style={{ color: '#f59e0b' }}>cannot perform any operations</strong> until your account is reactivated.
                    </p>
                </div>

                {/* Info box */}
                <div style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
                    textAlign: 'left'
                }}>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div>🏫 <strong>Institute:</strong> {user?.institute_name}</div>
                        <div>📧 <strong>Your Email:</strong> {user?.email}</div>
                        <div style={{ color: '#f59e0b' }}>
                            📞 <strong>Next Step:</strong> Contact your institute administrator to reactivate your account.
                        </div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    style={{
                        width: '100%', padding: '0.85rem',
                        background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                        border: 'none', borderRadius: '12px',
                        color: '#fff', fontWeight: '700', fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
                        transition: 'transform 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Sign Out
                </button>
            </div>

            {/* Pulsing CSS */}
            <style>{`
                @keyframes blockPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
                    50% { box-shadow: 0 0 0 16px rgba(239,68,68,0); }
                }
            `}</style>
        </div>
    );
}

export default BlockedScreen;

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Zap, Lock, Mail, ChevronRight, Loader2, AlertCircle, Info } from 'lucide-react';

interface LoginProps {
    onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logo, setLogo] = useState<string>('');

    // Load company logo if available
    useEffect(() => {
        api.config.getLogo().then(setLogo);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const user = await api.auth.login(email, accessCode);
            onLoginSuccess(user);
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const fillCredentials = (e: string, c: string) => {
        setEmail(e);
        setAccessCode(c);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-64 bg-slate-900 skew-y-3 transform -translate-y-20 z-0"></div>
            
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 z-10 animate-fade-in relative">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center mb-4">
                        {logo ? (
                            <img src={logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <Zap className="w-8 h-8 text-blue-600 fill-current" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Bienvenido</h1>
                    <p className="text-slate-500 text-sm">RyV Instalaciones Eléctricas</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center text-sm text-red-700 animate-fade-in">
                            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="ejemplo@helioscuba.cu"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Código de Acceso</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="password" 
                                required
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono tracking-widest"
                                placeholder="••••••"
                            />
                        </div>
                        <p className="text-xs text-right mt-1 text-slate-400">Solicita tu código al administrador</p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Verificando...
                            </>
                        ) : (
                            <>
                                Iniciar Sesión
                                <ChevronRight className="w-5 h-5 ml-1" />
                            </>
                        )}
                    </button>
                </form>

                {/* DEV HELPER: Credenciales de prueba */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                        <div className="flex items-center text-indigo-800 mb-2">
                            <Info className="w-4 h-4 mr-2" />
                            <span className="text-xs font-bold uppercase">Credenciales Demo</span>
                        </div>
                        <div className="space-y-2">
                            <button 
                                onClick={() => fillCredentials('jmaranon1966@gmail.com', 'ALEJ01')}
                                className="w-full text-left text-xs p-2 bg-white rounded border border-indigo-100 hover:border-indigo-300 transition-colors flex justify-between items-center group"
                            >
                                <div>
                                    <span className="font-bold text-slate-700 block">Administrador</span>
                                    <span className="text-slate-500">jmaranon1966@gmail.com</span>
                                </div>
                                <span className="text-indigo-600 font-mono font-bold bg-indigo-50 px-1.5 py-0.5 rounded">ALEJ01</span>
                            </button>
                            <button 
                                onClick={() => fillCredentials('beatriz.r@helioscuba.cu', 'BEAT02')}
                                className="w-full text-left text-xs p-2 bg-white rounded border border-indigo-100 hover:border-indigo-300 transition-colors flex justify-between items-center group"
                            >
                                <div>
                                    <span className="font-bold text-slate-700 block">Gestor Legal</span>
                                    <span className="text-slate-500">beatriz.r@helioscuba.cu</span>
                                </div>
                                <span className="text-indigo-600 font-mono font-bold bg-indigo-50 px-1.5 py-0.5 rounded">BEAT02</span>
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-4">
                        Sistema de Gestión Interna v1.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
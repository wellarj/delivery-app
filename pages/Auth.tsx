import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const response = await api.post('', 
          {
            email: formData.email,
            password: formData.password
          }, 
          { 
            params: { action: 'login' } 
          }
        );
        
        login(response.data.token, response.data.user);
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from);
      } else {
        const response = await api.post('', 
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            cpf: formData.cpf,
            password: formData.password
          }, 
          { 
            params: { action: 'register' } 
          }
        );
        
        login(response.data.token, response.data.user);
        navigate('/');
      }
    } catch (err: any) {
      console.error("Auth Error", err);
      const errorMessage = err.response?.data?.error || 'Erro ao conectar com o servidor.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[90vh] bg-[#EDE4C2] px-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl">
        
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-[#254F22] text-white rounded-2xl flex items-center justify-center text-3xl font-serif italic font-bold mx-auto mb-4 shadow-lg">
             M
           </div>
           <h2 className="text-3xl font-extrabold text-[#254F22] tracking-tight mb-2">
             Manuelita
           </h2>
           <p className="text-gray-500 font-medium">
             {isLogin ? 'Bem-vindo de volta.' : 'Crie sua conta premium.'}
           </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#254F22] uppercase tracking-wide ml-1">Nome Completo</label>
              <input
                type="text"
                name="name"
                required={!isLogin}
                placeholder="Ex: Maria Silva"
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#254F22] focus:border-transparent outline-none transition placeholder-gray-400 font-medium"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#254F22] uppercase tracking-wide ml-1">E-mail</label>
            <input
              type="email"
              name="email"
              required
              placeholder="seu@email.com"
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#254F22] focus:border-transparent outline-none transition placeholder-gray-400 font-medium"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#254F22] uppercase tracking-wide ml-1">Telefone</label>
                <input
                  type="tel"
                  name="phone"
                  required={!isLogin}
                  placeholder="(99) 99999-9999"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#254F22] focus:border-transparent outline-none transition placeholder-gray-400 font-medium"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#254F22] uppercase tracking-wide ml-1">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  required={!isLogin}
                  placeholder="000.000.000-00"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#254F22] focus:border-transparent outline-none transition placeholder-gray-400 font-medium"
                  value={formData.cpf}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#254F22] uppercase tracking-wide ml-1">Senha</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="******"
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#254F22] focus:border-transparent outline-none transition placeholder-gray-400 font-medium"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#254F22] text-white font-bold py-4 rounded-xl hover:bg-[#1a3818] transition transform active:scale-[0.98] shadow-xl disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? (
                <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                </>
            ) : (isLogin ? 'Entrar' : 'Cadastrar Conta')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-sm text-gray-500 hover:text-[#254F22] font-semibold transition underline decoration-gray-300 underline-offset-4"
          >
            {isLogin ? 'Não tem uma conta? Crie agora' : 'Já possui conta? Fazer login'}
          </button>
        </div>
      </div>
    </div>
  );
};
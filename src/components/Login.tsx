import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2, TrendingUp } from 'lucide-react';

const Login = () => {
	const { loginWithEmail, registerWithEmail, loading, error } = useAuth();
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (isLogin) {
				await loginWithEmail(email, password);
			} else {
				await registerWithEmail(email, password);
			}
		} catch (e) {
			// Error is handled by hook
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
			<div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
				<div className="bg-blue-600 p-8 text-center text-white">
					<div className="flex justify-center mb-4">
						<div className="bg-white/20 p-3 rounded-full">
							<TrendingUp size={32} />
						</div>
					</div>
					<h1 className="text-2xl font-bold">智投 StockTrack</h1>
					<p className="text-blue-100 mt-2">您的个人投资助手</p>
				</div>

				<div className="p-8">
					{error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6">{error}</div>}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
							<input
								type="email"
								required
								className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="name@example.com"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
							<input
								type="password"
								required
								className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center"
						>
							{loading && <Loader2 className="animate-spin mr-2" size={18} />}
							{isLogin ? '登录' : '注册新账号'}
						</button>
					</form>

					<div className="mt-6 text-center space-y-4">
						<button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:underline">
							{isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;

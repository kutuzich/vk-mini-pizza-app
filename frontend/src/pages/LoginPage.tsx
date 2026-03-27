import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await api.login(username, password);
      localStorage.setItem('token', data.access_token);
      navigate('/admin');
    } catch {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.logo}>🍕</div>
        <h1 className={styles.title}>PizzaNyam</h1>
        <p className={styles.subtitle}>Панель управления</p>
        {error && <div className={styles.error}>{error}</div>}
        <input
          className={styles.input}
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className={styles.btn} type="submit">
          Войти
        </button>
      </form>
    </div>
  );
}

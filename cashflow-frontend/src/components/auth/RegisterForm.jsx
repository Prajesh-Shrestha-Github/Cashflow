import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/auth';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await registerUser(formData);
      // On successful registration, redirect to login
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      setErrors(err || { general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] text-ink sm:text-5xl">Create your account</h1>
      </div>
      
      {errors.general && (
        <div className="mt-6 rounded-xl border border-signal/25 bg-signal/5 p-3.5 text-sm font-medium text-signal" role="alert">
          {errors.general}
        </div>
      )}
      
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="field"
              placeholder="Username"
            />
            {errors.username && (
              <p className="mt-1.5 text-sm text-signal">{errors.username}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="field"
              placeholder="Email"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-signal">{errors.email}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="label">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                className="field"
                placeholder="First Name"
              />
            </div>
            
            <div>
              <label htmlFor="last_name" className="label">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                className="field"
                placeholder="Last Name"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="field"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3.5 text-ink-mute hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
              >
                {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-sm text-signal">{errors.password}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password2" className="label">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="password2"
                name="password2"
                type={showPassword2 ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password2}
                onChange={handleChange}
                className="field"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword2(prev => !prev)}
                aria-label={showPassword2 ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showPassword2}
                className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3.5 text-ink-mute hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
              >
                {showPassword2 ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
              </button>
            </div>
            {errors.password2 && (
              <p className="mt-1.5 text-sm text-signal">{errors.password2}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
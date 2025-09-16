import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser, ldapLoginUser } from '../services/authService';
import { loginSuccess } from "../Features/auth/authSlice";
import alertService from "../services/alertService";
import { Underline } from 'lucide-react';
import { Input, Button, Form, List } from 'antd';
import axios from 'axios';
import '../styles/Login.css';
import logo from '../assets/canvendor.png';
import loginBg from '../assets/loginlogo.png';
import emailIcon from '../assets/email.png';
import passwordIcon from '../assets/password.png';
import userIcon from '../assets/usericon.png';
import BaseURL from "../BaseURL"; // 👈 Add this import

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [formType, setFormType] = useState('local');
    const [ldapServers, setLdapServers] = useState([]);
    const [selectedLdapId, setSelectedLdapId] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const fetchLdapServers = async () => {
        setLoading(true);
        try {
            // 👈 Corrected API call using BaseURL
            const response = await axios.post(`${BaseURL}/candocspro/get-ldap-all`);
            setLdapServers(response.data);
            setFormType('ldap');
        } catch (err) {
            console.error('Failed to fetch LDAP servers:', err);
            alertService.error("Fetch Error", "Failed to load LDAP servers.");
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSuccess = (data) => {
        const { userDetail, authToken, refreshToken } = data;
        if (!userDetail) throw new Error("userDetail missing in response");

        const groups = userDetail.groups?.map(g => g.groupName) || [];

        dispatch(loginSuccess({
            userId: userDetail.userId,
            username: userDetail.userName,
            email: userDetail.email,
            authToken,
            refreshToken,
            groups,
        }));

        if (groups.includes("Administrator")) {
            navigate("/admin/addnew");
        } else {
            navigate("/admin/fileupload");
        }
    };

    const onFinish = async (values) => {
        if (loading) return;
        setLoading(true);
        try {
            const data = await loginUser(values.email, values.password);
            handleLoginSuccess(data);
        } catch (err) {
            console.error('Login error:', err);
            alertService.error("Login Error", err.message || "An error occurred during login.");
        } finally {
            setLoading(false);
        }
    };

    const onLdapSelect = (id) => {
        setSelectedLdapId(id);
    };

    const onLdapSubmit = async (values) => {
        if (loading) return;
        setLoading(true);
        try {
            const data = await ldapLoginUser(selectedLdapId, values.email, values.password);
            handleLoginSuccess(data);
        } catch (err) {
            console.error('LDAP login error:', err);
            alertService.error("LDAP Login Error", err.message || "An error occurred during LDAP login.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-background" style={{ backgroundImage: `url(${loginBg})` }}></div>
            <div className="login-form-card">
                <div className="login-header extended-header">
                    <img src={logo} alt="FileFlow Logo" className="app-logo" />
                    <h1>Welcome Back 👋</h1>
                    <p>Access your organized files</p>
                </div>

                {formType === 'local' && (
                    <Form layout="vertical" onFinish={onFinish} className="login-form">
                        <Form.Item
                            name="email"
                            rules={[{ required: true, message: 'Please input your email!' }]}
                        >
                            <Input
                                placeholder="Email"
                                prefix={<img src={emailIcon} alt="Email" className="input-icon" />}
                                className="custom-input"
                            />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please input your password!' }]}
                        >
                            <Input.Password
                                placeholder="Password"
                                prefix={<img src={passwordIcon} alt="Password" className="input-icon" />}
                                className="custom-input"
                            />
                        </Form.Item>
                        <div style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '10px' }}>
                            <a href="#" style={{ color: 'white' }} onClick={fetchLdapServers}>Ldap user?</a>
                        </div>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="login-button"
                            >
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                )}

                {formType === 'ldap' && !selectedLdapId && (
                    <div className="ldap-list-container">
                        <h3>Select LDAP Server</h3>
                        <List
                            itemLayout="horizontal"
                            loading={loading}
                            dataSource={ldapServers}
                            renderItem={item => (
                                <List.Item onClick={() => onLdapSelect(item.id)} className="ldap-list-item">
                                    <List.Item.Meta
                                           title={<a style={{ color: 'black',fontSize:'13px',fontFamily: 'Georgia, serif' }}>{item.ldapName}</a>}
                                           description={<span style={{ color: 'black', fontFamily: 'Georgia, serif' }}>{item.url}</span>}
                                    />
                                </List.Item>
                            )}
                        />
                        <div style={{ textAlign: 'right', marginTop: '20px' ,fontSize:'15px'}}>
                            <a href="#" style={{ color: 'white' }} onClick={() => setFormType('local')}> Local User Login</a>
                        </div>
                    </div>
                )}

                {formType === 'ldap' && selectedLdapId && (
                    <Form layout="vertical" onFinish={onLdapSubmit} className="login-form">
                        <Form.Item
                            name="email"
                            rules={[{ required: true, message: 'Please input your LDAP username!' }]}
                        >
                            <Input
                                placeholder="LDAP Username"
                                prefix={<img src={userIcon} alt="User" className="input-icon" />}
                                className="custom-input"
                            />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please input your password!' }]}
                        >
                            <Input.Password
                                placeholder="Password"
                                prefix={<img src={passwordIcon} alt="Password" className="input-icon" />}
                                className="custom-input"
                            />
                        </Form.Item>
                        <div style={{ textAlign: 'right', marginTop: '-10px',marginBottom:'10px'}}>
                            <a href="#" style={{ color: 'white' }} onClick={() => {
                          setSelectedLdapId(null);
                          setFormType('local');
                      }}>Local user?</a>
                        </div>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="login-button"
                            >
                                LDAP Login
                            </Button>
                        </Form.Item>
                    </Form>
                )}
            </div>
        </div>
    );
};

export default Login;
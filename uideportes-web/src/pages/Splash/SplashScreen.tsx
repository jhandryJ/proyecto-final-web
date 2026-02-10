import { Box, Fade, Zoom, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

// Define keyframes for animations using MUI system
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.5); opacity: 1; }
  100% { transform: scale(1); opacity: 0.5; }
`;

export function SplashScreen() {
    const navigate = useNavigate();
    const [show, setShow] = useState(true);

    useEffect(() => {
        const fadeTimer = setTimeout(() => {
            setShow(false);
        }, 3500); // Start fade out at 3.5s

        const navTimer = setTimeout(() => {
            navigate('/login');
        }, 4000); // Navigate after animation completes

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(navTimer);
        };
    }, [navigate]);

    return (
        <Fade in={show} timeout={500}>
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #004B9B 0%, #0066CC 50%, #0080FF 100%)',
                    zIndex: 9999,
                    overflow: 'hidden',
                }}
            >
                {/* Animated circles background */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        overflow: 'hidden',
                        opacity: 0.1,
                        pointerEvents: 'none',
                    }}
                >
                    {/* Static background circles for simplicity */}
                    <Box sx={{
                        position: 'absolute',
                        top: '10%',
                        left: '10%',
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        bgcolor: 'white',
                    }} />
                    <Box sx={{
                        position: 'absolute',
                        bottom: '20%',
                        right: '15%',
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        bgcolor: 'white',
                    }} />
                </Box>

                {/* Logo with float animation */}
                <Zoom in={show} timeout={800} style={{ transitionDelay: show ? '200ms' : '0ms' }}>
                    <Box
                        component="img"
                        src={logo}
                        alt="UIDE Deportes"
                        sx={{
                            width: '80%',
                            maxWidth: 500,
                            height: 'auto',
                            animation: `${float} 3s ease-in-out infinite`,
                            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))'
                        }}
                    />
                </Zoom>

                {/* Loading text with fade animation */}
                <Fade in={show} timeout={1000} style={{ transitionDelay: show ? '600ms' : '0ms' }}>
                    <Typography
                        variant="h5"
                        sx={{
                            color: 'white',
                            mt: 4,
                            fontWeight: 600,
                            letterSpacing: 2,
                            textTransform: 'uppercase',
                            textAlign: 'center',
                            position: 'relative',
                            zIndex: 1,
                            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                        }}
                    >
                        Tu Pasión, Tu Equipo, Tu Universidad
                    </Typography>
                </Fade>

                {/* Loading dots animation */}
                <Fade in={show} timeout={1000} style={{ transitionDelay: show ? '800ms' : '0ms' }}>
                    <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                        {[0, 1, 2].map((i) => (
                            <Box
                                key={i}
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    animation: `${pulse} 1.5s infinite`,
                                    animationDelay: `${i * 0.2}s`,
                                }}
                            />
                        ))}
                    </Box>
                </Fade>
            </Box>
        </Fade>
    );
}

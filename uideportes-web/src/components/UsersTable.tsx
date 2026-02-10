import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Box,
    Typography,
    Chip,
    InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { Usuario } from '../services/users.service';

interface UsersTableProps {
    users: Usuario[];
}

export const UsersTable = ({ users }: UsersTableProps) => {
    const [filterEmail, setFilterEmail] = useState('');

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(filterEmail.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Total Usuarios: {filteredUsers.length}
                </Typography>
                <TextField
                    placeholder="Filtrar por correo institucional..."
                    variant="outlined"
                    size="small"
                    value={filterEmail}
                    onChange={(e) => setFilterEmail(e.target.value)}
                    sx={{ width: 300 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                <Table sx={{ minWidth: 650 }} aria-label="users table">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Correo Institucional</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Facultad / Carrera</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Cédula</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <TableRow
                                    key={user.id}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                {user.nombres} {user.apellidos}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.rol}
                                            size="small"
                                            color={user.rol === 'ADMIN' ? 'secondary' : 'primary'}
                                            variant={user.rol === 'ESTUDIANTE' ? 'outlined' : 'filled'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            {user.facultad && (
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    {user.facultad}
                                                </Typography>
                                            )}
                                            {user.carrera && (
                                                <Typography variant="body2">
                                                    {user.carrera}
                                                </Typography>
                                            )}
                                            {!user.facultad && !user.carrera && '-'}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{user.cedula}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    <Typography color="text.secondary">
                                        No se encontraron usuarios con ese criterio de búsqueda.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

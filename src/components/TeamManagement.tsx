
import React, { useState } from 'react';
import { User } from '../types';
import { Plus, Search, Users, Briefcase, X, Mail, Database, RotateCcw, Edit, Camera, Trash2, Upload, Key, Check } from 'lucide-react';

interface TeamManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
  onResetData?: () => void;
  departments?: string[]; 
  roles?: string[]; // Dynamic Roles (Specialties now)
}

const TeamManagement: React.FC<TeamManagementProps> = ({ 
    users, onAddUser, onUpdateUser, onDeleteUser, onResetData, 
    departments = [], roles = [] 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for Create/Edit
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [userForm, setUserForm] = useState<Partial<User>>({
    name: '',
    email: '',
    role: '',
    specialties: [],
    department: departments[0] || 'General',
    avatar: ''
  });

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateAccessCode = () => {
      // 6-digit alphanumeric code
      return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const openAddModal = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      role: '',
      specialties: [],
      department: departments[0] || 'General',
      avatar: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      specialties: user.specialties || [], // Load specialties
      department: user.department,
      avatar: user.avatar
    });
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
      if (confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
          if (onDeleteUser) onDeleteUser(user.id);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;

    // Use primary specialty as Role if role is empty for display purposes
    const displayRole = userForm.role || (userForm.specialties && userForm.specialties.length > 0 ? userForm.specialties[0] : 'Staff');

    if (editingUser && onUpdateUser) {
        // Update existing
        onUpdateUser({
            ...editingUser,
            name: userForm.name,
            email: userForm.email,
            role: displayRole,
            specialties: userForm.specialties || [],
            department: userForm.department || editingUser.department,
            avatar: userForm.avatar || editingUser.avatar,
            accessCode: editingUser.accessCode || generateAccessCode() 
        });
    } else {
        // Create new
        const newUser: User = {
          id: `u${Date.now()}`,
          name: userForm.name,
          email: userForm.email,
          role: displayRole,
          specialties: userForm.specialties || [],
          department: userForm.department || 'General',
          avatar: userForm.avatar || '',
          accessCode: generateAccessCode(),
          isActive: true
        };
        onAddUser(newUser);
    }

    setIsModalOpen(false);
  };

  const toggleSpecialty = (specialty: string) => {
      const current = userForm.specialties || [];
      if (current.includes(specialty)) {
          setUserForm({ ...userForm, specialties: current.filter(s => s !== specialty) });
      } else {
          setUserForm({ ...userForm, specialties: [...current, specialty] });
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setUserForm({ ...userForm, avatar: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getAvatarColor = (name: string) => {
      const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración y Equipo</h1>
          <p className="text-slate-500 text-sm">Gestión de recursos humanos, especialidades y accesos</p>
        </div>
        <div className="flex space-x-3">
            {onResetData && (
                <button 
                onClick={onResetData}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors border border-slate-300"
                title="Borrar todos los datos y restaurar ejemplo"
                >
                <RotateCcw className="w-5 h-5" />
                <span className="hidden md:inline">Restaurar Datos</span>
                </button>
            )}
            <button 
            onClick={openAddModal}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
            <Plus className="w-5 h-5" />
            <span>Agregar Personal</span>
            </button>
        </div>
      </div>

      {/* System Status Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
         <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                <Database className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-slate-900">Estado del Sistema</h3>
                <p className="text-sm text-slate-500">Gestión de accesos y perfiles activa. Total usuarios: {users.length}</p>
            </div>
         </div>
         <div className="text-right">
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                 Online
             </span>
         </div>
      </div>

      {/* Filter */}
      <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Buscar por nombre, especialidad o departamento..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center transition-all hover:shadow-md group">
            {/* Action Buttons */}
            <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                    onClick={() => openEditModal(user)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                    title="Editar Usuario"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => handleDelete(user)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    title="Eliminar Usuario"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="w-20 h-20 rounded-full mb-4 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center bg-slate-100">
               {user.avatar ? (
                   <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
               ) : (
                   <div className={`w-full h-full flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(user.name)}`}>
                       {getInitials(user.name)}
                   </div>
               )}
            </div>
            <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
            
            <a href={`mailto:${user.email}`} className="text-xs text-slate-400 mt-1 flex items-center hover:text-emerald-600 transition-colors">
                <Mail className="w-3 h-3 mr-1" />
                {user.email}
            </a>

            {/* Access Code Display */}
            <div className="mt-3 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center space-x-2 border border-slate-200">
                <Key className="w-3 h-3 text-slate-400" />
                <span className="text-xs font-mono font-bold text-slate-600 tracking-wider" title="Código de Acceso">{user.accessCode || '----'}</span>
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-1">
                {user.specialties?.map(spec => (
                    <span key={spec} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded-full font-medium border border-emerald-100">
                        {spec}
                    </span>
                ))}
                {(!user.specialties || user.specialties.length === 0) && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full">Sin especialidad</span>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-center text-slate-500 text-sm">
              <Briefcase className="w-4 h-4 mr-2" />
              {user.department}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{editingUser ? 'Editar Personal' : 'Introducir Personal'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                    <input 
                    type="text" 
                    required
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={userForm.name}
                    onChange={e => setUserForm({...userForm, name: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                    <input 
                        type="email" 
                        required
                        placeholder="email@helioscuba.cu"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={userForm.email}
                        onChange={e => setUserForm({...userForm, email: e.target.value})}
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título / Cargo Visible</label>
                <input 
                    type="text"
                    placeholder="Ej. Jefe de Brigada"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={userForm.role}
                    onChange={e => setUserForm({...userForm, role: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Especialidades y Habilidades (Scheduler)</label>
                <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto bg-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {roles.map(role => {
                        const isSelected = userForm.specialties?.includes(role);
                        return (
                            <div 
                                key={role}
                                onClick={() => toggleSpecialty(role)}
                                className={`flex items-center px-3 py-2 rounded-md cursor-pointer text-xs font-medium transition-colors ${
                                    isSelected ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                {role}
                            </div>
                        )
                    })}
                </div>
                <p className="text-xs text-slate-500 mt-1">Selecciona todas las capacidades técnicas del usuario para la asignación inteligente.</p>
              </div>

              {/* IMAGE UPLOAD */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Foto de Perfil</label>
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border flex items-center justify-center">
                        {userForm.avatar ? (
                            <img src={userForm.avatar} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs text-slate-400 font-medium">
                                {userForm.name ? getInitials(userForm.name) : 'NA'}
                            </span>
                        )}
                    </div>
                    <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-xs font-medium flex items-center transition-colors shadow-sm">
                        <Upload className="w-3.5 h-3.5 mr-2" />
                        <span>Subir Foto</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    {userForm.avatar && (
                        <button 
                            type="button"
                            onClick={() => setUserForm({...userForm, avatar: ''})}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                            Quitar
                        </button>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={userForm.department}
                  onChange={e => setUserForm({...userForm, department: e.target.value})}
                >
                  {departments.length > 0 ? (
                      departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))
                  ) : (
                      <option value="General">General</option>
                  )}
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-md transition-colors"
                >
                  {editingUser ? 'Actualizar' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
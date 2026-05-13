import { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, Settings, Edit2, Trash2 } from 'lucide-react';
import { Card, Button } from '../../../ui';
import AddUserModal from '../modals/AddUserModal';

export default function UserManagementSection({ users, onUserAction, usersPage, setUsersPage }) {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'security' });

  const ITEMS_PER_PAGE = 8;

  // User Pagination
  const totalUsersPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice(
    (usersPage - 1) * ITEMS_PER_PAGE,
    usersPage * ITEMS_PER_PAGE
  );

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ ...user });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'security' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUserAction(editingUser ? 'update' : 'add', formData);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
        <div className="p-5 border-b border-slate-100 flex flex-col items-center justify-between gap-4 bg-white dark:bg-slate-900 dark:border-white/10">
          <div className="flex items-center space-x-3 self-start">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 dark:bg-white/10 dark:text-slate-300">
              <Settings size={20} />
            </div>
            <h2 className="type-card-title text-slate-900 dark:text-white">Daftar Akun Petugas</h2>
          </div>
          <Button onClick={handleAddNew} className="w-full rounded-[1.75rem]">
            <UserPlus size={18} /> Tambah Akun Baru
          </Button>
        </div>
        <div className="overflow-x-auto">
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {paginatedUsers.map(user => (
              <div key={user.id} className="p-5 flex justify-between items-center bg-white dark:bg-slate-900">
                <div className="space-y-1">
                  <p className="type-body font-bold text-slate-900 dark:text-white">{user.name}</p>
                  <p className="type-caption font-mono text-slate-500 dark:text-slate-400">{user.username}</p>
                  <span className="inline-block px-2 py-0.5 bg-slate-100 rounded type-overline text-slate-500 dark:bg-white/10 dark:text-slate-400">
                    {user.role}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleEdit(user)} 
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-slate-400 active:bg-brand-50 active:text-brand-600 dark:active:bg-brand-500/10"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => onUserAction('delete', user)} 
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-slate-400 active:bg-rose-50 active:text-rose-600 dark:active:bg-rose-500/10"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Users Pagination Controls */}
          {totalUsersPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex flex-col items-center justify-between bg-white gap-4 dark:bg-slate-900 dark:border-white/10">
              <div className="type-overline text-slate-400 text-center order-2">
                Total {users.length} Akun
              </div>
              <div className="flex items-center space-x-2 order-1 w-full justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                  disabled={usersPage === 1}
                  className="flex-1"
                >
                  Sebelumnya
                </Button>
                <div className="flex h-10 items-center px-4 bg-slate-50 rounded-2xl dark:bg-slate-950/70">
                  <span className="type-caption font-bold text-brand-600">{usersPage}</span>
                  <span className="type-caption font-bold text-slate-300 mx-2">/</span>
                  <span className="type-caption font-bold text-slate-500">{totalUsersPages}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUsersPage(prev => Math.min(prev + 1, totalUsersPages))}
                  disabled={usersPage === totalUsersPages}
                  className="flex-1"
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {createPortal(
        <AddUserModal 
          show={showModal}
          editingUser={editingUser}
          formData={formData}
          setFormData={setFormData}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
        />,
        document.body
      )}
    </div>
  );
}

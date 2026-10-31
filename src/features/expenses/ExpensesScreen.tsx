import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Image, ActivityIndicator } from 'react-native';
import { Plus, Calendar, Trash2, Edit3, Image as ImageIcon, X } from 'lucide-react-native';
import { getSupabase } from '../../lib/supabase';
import { pickImage, uploadImage } from '@/lib/images'; // Sesuai poin 1

export default function ExpensesScreen() {
  const [periode, setPeriode] = useState('Bulan Ini');
  const tabs = ['Hari Ini', 'Minggu Ini', 'Bulan Ini'];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [nominal, setNominal] = useState('');
  const [method, setMethod] = useState<'cash' | 'transfer'>('cash'); // Sesuai poin 5 (Metode Tunai/Transfer)
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null); // Untuk fungsi Edit

  // Ambil data dari tabel 'expenses' di Supabase
  const fetchExpenses = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setExpensesList(data);
    } catch (error: any) {
      console.error('Gagal memuat data pengeluaran:', error.message);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Sesuai poin 3: pickImage langsung mengembalikan uri
  const handlePickImage = async () => {
    try {
      const uri = await pickImage({ square: false });
      if (uri) {
        setImageUri(uri);
      }
    } catch (error) {
      console.error('Gagal mengambil gambar:', error);
    }
  };

  // Simpan atau Edit Pengeluaran (Sesuai poin 2 & 6)
  const handleSaveExpense = async () => {
    if (!description || !nominal) {
      Alert.alert('Peringatan', 'Keterangan dan nominal wajib diisi!');
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();
      let receipt_image_url = imageUri;

      // Jika ada gambar baru dan bukan URL lama, unggah ke storage
      if (imageUri && !imageUri.startsWith('http')) {
        receipt_image_url = await uploadImage("expense-receipts", imageUri);
      }

      const payload = {
        description,
        amount: parseFloat(nominal),
        method,
        receipt_image_url,
      };

      if (editingId) {
        // Proses Update / Edit
        const { error } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        Alert.alert('Sukses', 'Pengeluaran berhasil diperbarui!');
      } else {
        // Proses Insert Baru
        const { error } = await supabase
          .from('expenses')
          .insert([payload]);

        if (error) throw error;
        Alert.alert('Sukses', 'Pengeluaran berhasil disimpan!');
      }

      setModalVisible(false);
      resetForm();
      fetchExpenses();
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Hapus Pengeluaran (Sesuai poin 6)
  const handleDeleteExpense = async (id: string) => {
    Alert.alert('Konfirmasi Hapus', 'Apakah kamu yakin ingin menghapus pengeluaran ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            const supabase = getSupabase();
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            fetchExpenses();
          } catch (error: any) {
            Alert.alert('Gagal', error.message);
          }
        }
      }
    ]);
  };

  // Fungsi Buka Modal untuk Edit
  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setDescription(item.description || '');
    setNominal(String(item.amount || ''));
    setMethod(item.method || 'cash');
    setImageUri(item.receipt_image_url || null);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setDescription('');
    setNominal('');
    setMethod('cash');
    setImageUri(null);
  };

  const formatRupiah = (angka: number) => `Rp${angka.toLocaleString('id-ID')}`;
  const totalPengeluaran = expensesList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        
        {/* Filter Periode */}
        <View className="flex-row bg-white rounded-full p-1 mb-4 shadow-sm">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setPeriode(tab)}
              className={`flex-1 py-2 rounded-full items-center ${periode === tab ? 'bg-red-600' : 'bg-transparent'}`}
            >
              <Text className={`font-medium ${periode === tab ? 'text-white' : 'text-gray-500'}`}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Kartu Total */}
        <View className="bg-white p-4 rounded-2xl mb-6 shadow-sm border border-gray-100">
          <Text className="text-gray-500 text-sm mb-1">Total Pengeluaran ({periode})</Text>
          <Text className="text-2xl font-bold text-red-600">{formatRupiah(totalPengeluaran)}</Text>
        </View>

        <Text className="text-lg font-bold text-gray-800 mb-3">Daftar Pengeluaran</Text>

        {expensesList.map((item, index) => (
          <View key={item.id || index} className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1 mr-2">
                <View className="bg-red-50 px-2.5 py-1 rounded-md self-start mb-1">
                  <Text className="text-xs font-semibold text-red-600 uppercase">
                    {item.method === 'transfer' ? 'Transfer' : 'Tunai'}
                  </Text>
                </View>
                <Text className="text-base font-bold text-gray-800">{item.description}</Text>
              </View>
              <Text className="text-base font-bold text-red-600">{formatRupiah(item.amount)}</Text>
            </View>

            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <View className="flex-row items-center">
                <Calendar size={14} color="#9CA3AF" />
                <Text className="text-xs text-gray-400 ml-1.5">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : 'Hari ini'}
                </Text>
                {item.receipt_image_url && (
                  <View className="flex-row items-center ml-3 bg-blue-50 px-2 py-0.5 rounded">
                    <ImageIcon size={12} color="#1A4FE8" />
                    <Text className="text-xs text-blue-600 ml-1">Nota</Text>
                  </View>
                )}
              </View>
              
              {/* Tombol Aksi Edit & Hapus (Sesuai poin 6) */}
              <View className="flex-row space-x-2">
                <TouchableOpacity onPress={() => handleOpenEdit(item)} className="p-2 bg-gray-50 rounded-lg">
                  <Edit3 size={16} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteExpense(item.id)} className="p-2 bg-red-50 rounded-lg">
                  <Trash2 size={16} color="#EE2A24" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Tombol Mengapung */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={() => { resetForm(); setModalVisible(true); }}
          className="bg-red-600 flex-row items-center px-5 py-3.5 rounded-full shadow-lg"
        >
          <Plus size={20} color="#FFFFFF" />
          <Text className="text-white font-bold ml-2">Tambah Pengeluaran</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Form */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl">
            
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-800">
                {editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="p-1">
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-medium text-gray-700 mb-1">Keterangan Pengeluaran</Text>
            <TextInput
              placeholder="Contoh: Belanja Bahan Daging"
              value={description}
              onChangeText={setDescription}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 text-gray-800"
            />

            <Text className="text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</Text>
            <TextInput
              placeholder="0"
              keyboardType="numeric"
              value={nominal}
              onChangeText={setNominal}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 text-gray-800"
            />

            {/* Pilihan Metode Pembayaran (Sesuai poin 5) */}
            <Text className="text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</Text>
            <View className="flex-row mb-4 space-x-2">
              <TouchableOpacity
                onPress={() => setMethod('cash')}
                className={`flex-1 py-2.5 rounded-xl border items-center ${method === 'cash' ? 'bg-red-50 border-red-600' : 'border-gray-200'}`}
              >
                <Text className={`font-medium ${method === 'cash' ? 'text-red-600' : 'text-gray-500'}`}>Tunai</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMethod('transfer')}
                className={`flex-1 py-2.5 rounded-xl border items-center ${method === 'transfer' ? 'bg-red-50 border-red-600' : 'border-gray-200'}`}
              >
                <Text className={`font-medium ${method === 'transfer' ? 'text-red-600' : 'text-gray-500'}`}>Transfer</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-medium text-gray-700 mb-2">Foto Nota (Opsional)</Text>
            <TouchableOpacity 
              onPress={handlePickImage}
              className="border-2 border-dashed border-gray-300 rounded-xl p-3 items-center mb-4 bg-gray-50 flex-row justify-center"
            >
              <ImageIcon size={20} color="#9CA3AF" />
              <Text className="text-sm text-gray-500 ml-2">
                {imageUri ? 'Nota Dipilih (Ubah)' : 'Lampirkan Nota'}
              </Text>
            </TouchableOpacity>

            {imageUri && (
              <Image source={{ uri: imageUri }} className="w-full h-32 rounded-xl mb-4 object-cover" />
            )}

            <TouchableOpacity 
              onPress={handleSaveExpense}
              disabled={loading}
              className="bg-blue-600 py-3.5 rounded-xl items-center shadow-sm"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-base">Simpan</Text>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
}
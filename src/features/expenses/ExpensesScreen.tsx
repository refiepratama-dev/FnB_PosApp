import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Image, ActivityIndicator } from 'react-native';
import { Plus, Calendar, Trash2, Edit3, Image as ImageIcon, X } from 'lucide-react-native';
import { getSupabase } from '../../lib/supabase';
// Menyesuaikan utilitas standar tim untuk gambar dan filter
import { pickImage, uploadImage } from '../../lib/storage'; 

export default function ExpensesScreen() {
  const [periode, setPeriode] = useState('Bulan Ini');
  const tabs = ['Hari Ini', 'Minggu Ini', 'Bulan Ini'];
  
  const [modalVisible, setModalVisible] = useState(false);
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState('');
  const [kategori, setKategori] = useState('Bahan Baku');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expensesList, setExpensesList] = useState<any[]>([]);

  // 1. Ambil data dari tabel 'expenses' di Supabase saat halaman dibuka
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

  // 2. Fungsi memilih foto nota menggunakan standar tim
  const handlePickImage = async () => {
    try {
      const result = await pickImage({ square: false });
      if (result && !result.canceled && result.assets[0].uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gagal mengambil gambar:', error);
    }
  };

  // 3. Simpan data pengeluaran ke tabel 'expenses' dan upload nota ke Supabase Storage
  const handleSaveExpense = async () => {
    if (!keterangan || !nominal) {
      Alert.alert('Peringatan', 'Keterangan dan nominal wajib diisi!');
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();
      let receiptUrl = null;

      // Jika ada foto nota yang dipilih, unggah ke storage 'expense-receipts'
      if (imageUri) {
        receiptUrl = await uploadImage("expense-receipts", imageUri);
      }

      // Masukkan ke database Supabase
      const { error } = await supabase.from('expenses').insert([
        {
          title: keterangan,
          amount: parseFloat(nominal),
          category: kategori,
          receipt_url: receiptUrl,
          date: new Date().toISOString(),
        }
      ]);

      if (error) throw error;

      Alert.alert('Sukses', 'Pengeluaran berhasil disimpan!');
      setModalVisible(false);
      setKeterangan('');
      setNominal('');
      setImageUri(null);
      fetchExpenses(); // Refresh daftar pengeluaran
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka: number) => `Rp${angka.toLocaleString('id-ID')}`;
  const totalPengeluaran = expensesList.reduce((acc, curr) => acc + (curr.amount || curr.nominal || 0), 0);

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
              <View>
                <View className="bg-red-50 px-2.5 py-1 rounded-md self-start mb-1">
                  <Text className="text-xs font-semibold text-red-600">{item.category || item.kategori}</Text>
                </View>
                <Text className="text-base font-bold text-gray-800">{item.title || item.keterangan}</Text>
              </View>
              <Text className="text-base font-bold text-red-600">{formatRupiah(item.amount || item.nominal)}</Text>
            </View>

            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <View className="flex-row items-center">
                <Calendar size={14} color="#9CA3AF" />
                <Text className="text-xs text-gray-400 ml-1.5">
                  {item.date ? new Date(item.date).toLocaleDateString('id-ID') : 'Hari ini'}
                </Text>
                {(item.receipt_url || item.adaNota) && (
                  <View className="flex-row items-center ml-3 bg-blue-50 px-2 py-0.5 rounded">
                    <ImageIcon size={12} color="#1A4FE8" />
                    <Text className="text-xs text-blue-600 ml-1">Nota</Text>
                  </View>
                )}
              </View>
              <View className="flex-row space-x-2">
                <TouchableOpacity className="p-2 bg-gray-50 rounded-lg"><Edit3 size={16} color="#4B5563" /></TouchableOpacity>
                <TouchableOpacity className="p-2 bg-red-50 rounded-lg"><Trash2 size={16} color="#EE2A24" /></TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Tombol Mengapung */}
      <View className="absolute bottom-6 right-6">
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="bg-red-600 flex-row items-center px-5 py-3.5 rounded-full shadow-lg"
        >
          <Plus size={20} color="#FFFFFF" />
          <Text className="text-white font-bold ml-2">Tambah Pengeluaran</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Pop-up Tambah Pengeluaran */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl">
            
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-800">Tambah Pengeluaran</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="p-1">
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-medium text-gray-700 mb-1">Keterangan Pengeluaran</Text>
            <TextInput
              placeholder="Contoh: Belanja Bahan Daging"
              value={keterangan}
              onChangeText={setKeterangan}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 text-gray-800"
            />

            <Text className="text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</Text>
            <TextInput
              placeholder="0"
              keyboardType="numeric"
              value={nominal}
              onChangeText={setNominal}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-gray-800"
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Foto Nota (Opsional)</Text>
            <TouchableOpacity 
              onPress={handlePickImage}
              className="border-2 border-dashed border-gray-300 rounded-xl p-3 items-center mb-6 bg-gray-50 flex-row justify-center"
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
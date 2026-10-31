import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Package, Receipt, Users, Clock, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  
  // Dummy data ringkasan hari ini
  const ringkasan = { omzet: 1250000, transaksi: 45, laba: 850000 };
  
  // Dummy data order realtime
  const recentOrders = [
    { id: 'TP-261031-045', tipe: 'Dine-in (Meja 4)', total: 75000, waktu: '20:15', status: 'Lunas' },
    { id: 'TP-261031-044', tipe: 'Takeaway', total: 45000, waktu: '20:05', status: 'Lunas' },
    { id: 'TP-261031-043', tipe: 'Ojol (GoFood)', total: 115000, waktu: '19:50', status: 'Lunas' },
  ];

  const formatRupiah = (angka: number) => `Rp${angka.toLocaleString('id-ID')}`;

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      
      {/* 1. Ringkasan Hari Ini */}
      <View className="mb-6">
        <Text className="text-lg font-bold text-gray-800 mb-3">Ringkasan Hari Ini</Text>
        <View className="flex-row flex-wrap justify-between">
          <View className="bg-white p-4 rounded-2xl w-[48%] mb-4 shadow-sm border border-gray-100">
            <Text className="text-gray-500 text-sm mb-1">Omzet</Text>
            <Text className="text-xl font-bold text-blue-600">{formatRupiah(ringkasan.omzet)}</Text>
          </View>
          <View className="bg-white p-4 rounded-2xl w-[48%] mb-4 shadow-sm border border-gray-100">
            <Text className="text-gray-500 text-sm mb-1">Jml Order</Text>
            <Text className="text-xl font-bold text-gray-800">{ringkasan.transaksi}</Text>
          </View>
          <View className="bg-white p-4 rounded-2xl w-full shadow-sm border border-gray-100">
            <Text className="text-gray-500 text-sm mb-1">Estimasi Laba</Text>
            <Text className="text-xl font-bold text-green-600">{formatRupiah(ringkasan.laba)}</Text>
          </View>
        </View>
      </View>

      {/* 2. Grid Shortcut (Akses Cepat) */}
      <View className="mb-8">
        <Text className="text-lg font-bold text-gray-800 mb-3">Akses Cepat</Text>
        <View className="flex-row justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          
          <TouchableOpacity 
            className="items-center w-1/3"
            onPress={() => router.push('/owner/stock')}
          >
            <View className="bg-blue-100 p-3 rounded-full mb-2">
              <Package size={28} color="#1A4FE8" />
            </View>
            <Text className="text-sm font-medium text-gray-700">Stok</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="items-center w-1/3"
            onPress={() => router.push('/owner/expenses')}
          >
            <View className="bg-red-100 p-3 rounded-full mb-2">
              <Receipt size={28} color="#EE2A24" />
            </View>
            <Text className="text-sm font-medium text-gray-700">Pengeluaran</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="items-center w-1/3"
            onPress={() => router.push('/owner/members')}
          >
            <View className="bg-green-100 p-3 rounded-full mb-2">
              <Users size={28} color="#10B981" />
            </View>
            <Text className="text-sm font-medium text-gray-700">Member</Text>
          </TouchableOpacity>
          
        </View>
      </View>

      {/* 3. Order Masuk Realtime */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-gray-800">Order Terbaru</Text>
          <TouchableOpacity onPress={() => router.push('/owner/orders')}>
            <Text className="text-blue-600 font-medium">Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        
        {recentOrders.map((order, index) => (
          <TouchableOpacity 
            key={index} 
            className="flex-row justify-between items-center bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100"
            onPress={() => router.push('/owner/orders')}
          >
            <View className="flex-row items-center">
              <View className="bg-gray-100 p-2 rounded-full mr-3">
                <Clock size={20} color="#6B7280" />
              </View>
              <View>
                <Text className="font-bold text-gray-800">{order.id}</Text>
                <Text className="text-sm text-gray-500">{order.waktu} • {order.tipe}</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="font-bold text-blue-600">{formatRupiah(order.total)}</Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
}
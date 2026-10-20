import React, { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { useSession } from '@/core/auth/AuthProvider';
export default function Login() { const { signIn } = useSession(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); return <View style={{padding:24,gap:12}}><Text>Sign in</Text><TextInput autoCapitalize="none" placeholder="Email" value={email} onChangeText={setEmail}/><TextInput secureTextEntry placeholder="Password" value={password} onChangeText={setPassword}/>{error?<Text>{error}</Text>:null}<Button title="Sign in" onPress={()=>signIn(email,password).catch(e=>setError(e.message))}/></View>; }

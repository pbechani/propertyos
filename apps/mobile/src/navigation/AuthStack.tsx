/**
 * AuthStack — screens shown before the user is authenticated.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList } from './types';
import { SplashScreen } from '../SplashScreen';
import { Onboarding1, Onboarding2, Onboarding3, TermsScreen } from '../Onboarding';
import {
  LoginScreen,
  RoleSelectionScreen,
  ForgotPasswordScreen,
  SignupHomeownerScreen,
  SignupContractorScreen,
  VerificationScreen,
  SuccessScreen,
} from '../AuthScreens';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="splash" component={SplashScreen} />
      <Stack.Screen name="onboarding1" component={Onboarding1} />
      <Stack.Screen name="onboarding2" component={Onboarding2} />
      <Stack.Screen name="onboarding3" component={Onboarding3} />
      <Stack.Screen name="roleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="login" component={LoginScreen} />
      <Stack.Screen name="signupHomeowner" component={SignupHomeownerScreen} />
      <Stack.Screen name="signupContractor" component={SignupContractorScreen} />
      <Stack.Screen name="forgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="verification" component={VerificationScreen} />
      <Stack.Screen name="terms" component={TermsScreen} />
      <Stack.Screen name="success" component={SuccessScreen} />
    </Stack.Navigator>
  );
}

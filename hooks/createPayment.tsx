import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CreatePaymentParams = {
  typeID: string;
  amount: string;
  currency: string;
  address1: string;
  address2: string;
  offeringID: string;
  walletID: string;
  accountID: string;
  envelopeIds: unknown;
};

export const createPaymentOrder = () => {

  const payment = async (params: CreatePaymentParams) => {
    const {
      typeID,
      amount,
      currency,
      address1,
      address2,
      offeringID,
      walletID,
      accountID,
      envelopeIds,
    } = params;
    console.log('create payment called with', typeID, amount, currency, envelopeIds);
    try {

      const response = await NetworkService.post(
        '/orders',
        {
          type: typeID,
          amount: amount,
          currency: currency,
          display_name: 'Token',
          address: {
            "country": address1,
            "city": address2
          },
          envelopeId: envelopeIds,
          offeringId: offeringID,
          //blockchainAccountWalletId: walletID,
          accountId: accountID,
          success_url: 'http://localhost:5173/payment-success',
          failure_url: 'http://localhost:5173/payment-success'
        }, // params (none in this case)
        // API_HEADER_CONFIG

        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
        }
      );

      console.log('payment details response', response);
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error, status: response.status };
      }
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';

      // Narrow down to Error type
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.log(
        'Error',
        'An error occurred while creating payment order. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  const checkPaymentStatus = async (orderID: string
  ) => {
    try {
      const response = await NetworkService.get(
        '/payments?orderId=' + orderID,
        {
        }, // params (none in this case)
        // API_HEADER_CONFIG

        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
        }
      );

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error, status: response.status };
      }
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';

      // Narrow down to Error type
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.log(
        'Error',
        'An error occurred while checking payment status. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  return {
    payment,
    checkPaymentStatus
  };
};

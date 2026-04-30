import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const docSign = () => {

  const docuSignature = async (document: any, offeringID: any, accountId: any) => {
    console.log(offeringID, '.....', accountId)
    try {

      const response = await NetworkService.post(
        '/documents',
        {
          document_links: document,
          offering_id: offeringID,
          account_id: accountId,
          signed_app: "DOCUSIGN"
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
        'An error occurred while sign document. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  const signStatus = async (envelopID: any) => {
    try {

      const response = await NetworkService.get(
        '/documents?envelopeId=' + envelopID,
        {
          envelopeId: envelopID
        }, // params (none in this case)
        // API_HEADER_CONFIG

        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
        }
      );

      console.log('sign status response', response);
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
        'An error occurred while checking signature status. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };


  return {
    docuSignature,
    signStatus
  };
};

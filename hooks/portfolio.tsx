import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const portfolio = () => {

  const getPortfolio = async (rootAccountId: any, activeFilter: any, pg: any) => {
    console.log("GET PORTFOLIO CALLED");
    console.log("ROOT ACCOUNT ID:", rootAccountId);
    console.log("ACTIVE FILTER:", activeFilter);
    console.log("PG:", pg);
    try {

      const response = await NetworkService.post(
        `/portfolio?pg=${pg}`,
        {
          rootAccountId: rootAccountId,
          activeFilter: activeFilter
        },
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
        'An error occurred while getting portfolio. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  const portfolioActivities = async (accountId: any, page: any, limit: any) => {
    try {

      const response = await NetworkService.get(
        '/portfolio/activities?page=' + page + '&limit=' + limit + '&accountId=' + accountId,
        {
          // accountId: accountId,
          // page: page,
          // limit: limit,
        }, // params (none in this case)
        // API_HEADER_CONFIG

        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`,
        }
      );

       console.log('portfolio response', JSON.stringify(response, null, 2));
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
        'An error occurred while getting portfolio activities. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };



  return {
    getPortfolio,
    portfolioActivities
  };
};

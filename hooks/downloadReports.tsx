import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const downloadReports = () => {

    const downloadTransactionHistory = async (accountId: any) => {
        try {

            const response = await NetworkService.get(
                '/portfolio/export?type=transactions&format=csv&accountId=' + accountId,
                {
                    //accountId: accountId,
                }, // params (none in this case)
                // API_HEADER_CONFIG

                {
                    ...API_HEADER_CONFIG,
                    "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
                    "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
                }
            );

            console.log('download transaction history response', response);
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
                'An error occurred while fetching transaction history. Please try again.'
            );
            return { success: false, error: errorMessage };
        }
    };

    const downloadPortfolioReport = async (accountId: any) => {
        try {

            const response = await NetworkService.get(
                '/portfolio/export?type=portfolio&format=csv&accountId=' + accountId,
                {
                    rootAccountId: accountId
                }, // params (none in this case)
                // API_HEADER_CONFIG

                {
                    ...API_HEADER_CONFIG,
                    "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
                    "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
                }
            );

            console.log('download portfolio report response', response);

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
                'An error occurred while fetching portfolio report. Please try again.'
            );
            return { success: false, error: errorMessage };
        }
    };

    const downloadPerformanceReport = async (accountId: any) => {
        try {

            const response = await NetworkService.get(
                '/portfolio/export?type=performance&format=csv&accountId=' + accountId,
                {
                    //accountId: accountId,
                }, // params (none in this case)
                // API_HEADER_CONFIG

                {
                    ...API_HEADER_CONFIG,
                    "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
                    "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
                }
            );

            console.log('download performance report response', response);

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
                'An error occurred while fetching performance report. Please try again.'
            );
            return { success: false, error: errorMessage };
        }
    };


    return {
        downloadTransactionHistory,
        downloadPortfolioReport,
        downloadPerformanceReport
    };
};

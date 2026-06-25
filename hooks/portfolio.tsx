import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userManagement } from '@/hooks/userManagement';

export const PORTFOLIO_ACTIVITIES_LIMIT = 500;

export const portfolio = () => {
  const resolveActiveAccountId = async (): Promise<string | null> => {
    try {
      const userRes = await userManagement().getUser();
      const accountId = userRes.success
        ? userRes.data?.data?.activeAccount?.id
        : null;

      if (accountId) {
        const id = String(accountId);
        await AsyncStorage.setItem('AccountID', id);
        return id;
      }
    } catch (error: unknown) {
      console.log('resolveActiveAccountId failed:', error);
    }

    const stored = await AsyncStorage.getItem('AccountID');
    return stored?.trim() || null;
  };

  const getPortfolio = async (rootAccountId: string | null, activeFilter: string, pg: string) => {
    try {
      const response = await NetworkService.post(
        `/portfolio?pg=${pg}`,
        {
          rootAccountId,
          activeFilter,
        },
        API_HEADER_CONFIG,
      );
      console.log('portfolio response', JSON.stringify(response, null, 2));
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error, status: response.status };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.log('Error', 'An error occurred while getting portfolio. Please try again.');
      return { success: false, error: errorMessage };
    }
  };

  const portfolioActivities = async (
    accountId: string | null,
    page: number,
    limit: number = PORTFOLIO_ACTIVITIES_LIMIT,
  ) => {
    if (!accountId) {
      return { success: false, error: 'Missing accountId', status: 400 };
    }

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        accountId,
      });

      const response = await NetworkService.get(
        `/portfolio/activities?${query.toString()}`,
        {},
        API_HEADER_CONFIG,
      );
      console.log('portfolio activities response', JSON.stringify(response, null, 2));
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error, status: response.status };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.log('Error', 'An error occurred while getting portfolio activities. Please try again.');
      return { success: false, error: errorMessage };
    }
  };

  return {
    resolveActiveAccountId,
    getPortfolio,
    portfolioActivities,
  };
};

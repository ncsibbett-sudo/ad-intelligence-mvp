import axios from 'axios';
import { MetaAdData } from '@/lib/types';

const META_GRAPH_API = 'https://graph.facebook.com/v18.0';

export class MetaAdsClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getAdAccount(adAccountId: string) {
    try {
      const response = await axios.get(
        `${META_GRAPH_API}/${adAccountId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'name,account_id,currency',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching ad account:', error);
      throw error;
    }
  }

  async getAds(adAccountId: string): Promise<MetaAdData[]> {
    try {
      const response = await axios.get(
        `${META_GRAPH_API}/${adAccountId}/ads`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'id,name,creative{image_url,body,title,link_description,call_to_action_type},insights{impressions,clicks,ctr,cpc,spend}',
            limit: 50,
          },
        }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching ads:', error);
      throw error;
    }
  }

  async getAdCreative(creativeId: string) {
    try {
      const response = await axios.get(
        `${META_GRAPH_API}/${creativeId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'image_url,body,title,link_description,call_to_action_type,thumbnail_url',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching creative:', error);
      throw error;
    }
  }
}

// Meta Ad Library API (for competitor ads - public data)
export class MetaAdLibraryClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async searchAds(searchTerm: string, adReachedCountries = 'US') {
    try {
      const response = await axios.get(
        `${META_GRAPH_API}/ads_archive`,
        {
          params: {
            access_token: this.accessToken,
            search_terms: searchTerm,
            ad_reached_countries: adReachedCountries,
            ad_active_status: 'ALL',
            fields: 'id,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,ad_snapshot_url,impressions,spend,page_name',
            limit: 20,
          },
        }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching ads:', error);
      throw error;
    }
  }
}

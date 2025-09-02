import React from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapsLoaderProps {
  children: React.ReactNode;
}

interface GoogleMapsLoaderState {
  isLoaded: boolean;
  error: string | null;
}

class GoogleMapsLoader extends React.Component<
  GoogleMapsLoaderProps,
  GoogleMapsLoaderState
> {
  private loader: Loader;

  constructor(props: GoogleMapsLoaderProps) {
    super(props);
    this.state = {
      isLoaded: false,
      error: null,
    };

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'Initializing Google Maps Loader with API key:',
        apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set'
      );
    }

    this.loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });
  }

  async componentDidMount() {
    // APIキーが設定されていない場合は開発モードとして扱う
    if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      console.warn(
        'Google Maps API key not found. Running in development mode without maps.'
      );
      this.setState({
        error:
          'Google Maps API キーが設定されていません。開発モードで実行中です。',
      });
      return;
    }

    console.log(
      'Google Maps API Key:',
      process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set'
    );

    try {
      await this.loader.load();
      console.log('Google Maps loaded successfully');
      this.setState({ isLoaded: true });
    } catch (error) {
      console.error('Google Maps loading error:', error);

      let errorMessage = 'Failed to load Google Maps';
      if (error instanceof Error) {
        errorMessage = error.message;

        // 特定のエラーに対するアドバイスを追加
        if (
          error.message.includes('InvalidKeyMapError') ||
          error.message.includes('InvalidKey')
        ) {
          errorMessage +=
            '\n\nAPIキーの設定を確認してください：\n1. Google Cloud ConsoleでMaps JavaScript APIが有効になっているか\n2. APIキーにHTTP リファラー制限がかかっていないか\n3. APIキーの権限設定が正しいか';
        }
      }

      this.setState({
        error: errorMessage,
      });
    }
  }

  render() {
    const { isLoaded, error } = this.state;
    const { children } = this.props;

    if (error) {
      return (
        <div className="google-maps-error">
          <h3>Google Maps読み込みエラー</h3>
          <p>{error}</p>
          <p>APIキーが正しく設定されているか確認してください。</p>
          <p>開発用: キャラクター選択機能は動作します。</p>
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="google-maps-loading">
          <div className="loading-spinner"></div>
          <p>Google Mapsを読み込み中...</p>
        </div>
      );
    }

    return <>{children}</>;
  }
}

export default GoogleMapsLoader;
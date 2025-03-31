import React from 'react';
import DAWContainer from '../presentation/components/DAWContainer';

/**
 * DAW 頁面
 */
const DAWPage: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#121212',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 頂部工具欄 */}
      <div style={{
        height: '50px',
        backgroundColor: '#2c2c2c',
        borderBottom: '1px solid #3c3c3c',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px'
      }}>
        <h1 style={{
          color: '#ffffff',
          margin: 0,
          fontSize: '18px'
        }}>
          音頻工作站
        </h1>
      </div>

      {/* 主要內容區域 */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* 左側面板 */}
        <div style={{
          width: '200px',
          backgroundColor: '#1c1c1c',
          borderRight: '1px solid #3c3c3c',
          padding: '20px'
        }}>
          <h2 style={{
            color: '#ffffff',
            margin: '0 0 20px 0',
            fontSize: '16px'
          }}>
            音頻片段
          </h2>
          {/* TODO: 添加音頻片段列表 */}
        </div>

        {/* DAW 主界面 */}
        <div style={{
          flex: 1,
          overflow: 'hidden'
        }}>
          <DAWContainer />
        </div>

        {/* 右側面板 */}
        <div style={{
          width: '300px',
          backgroundColor: '#1c1c1c',
          borderLeft: '1px solid #3c3c3c',
          padding: '20px'
        }}>
          <h2 style={{
            color: '#ffffff',
            margin: '0 0 20px 0',
            fontSize: '16px'
          }}>
            效果器
          </h2>
          {/* TODO: 添加效果器列表 */}
        </div>
      </div>
    </div>
  );
};

export default DAWPage; 
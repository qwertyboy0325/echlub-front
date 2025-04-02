import React from 'react';
import { DAWGridView } from '../components/DAWGridView';

/**
 * DAW 容器組件
 * 負責管理 DAW 的狀態和生命週期
 */
export const DAWContainer: React.FC = () => {
    return (
        <div style={{ 
            width: '100%', 
            height: '100vh', 
            backgroundColor: '#1a1a1a',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* 頂部工具欄 */}
            <div style={{
                height: '50px',
                backgroundColor: '#2a2a2a',
                borderBottom: '1px solid #3a3a3a',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px'
            }}>
                <h1 style={{ 
                    color: '#fff', 
                    margin: 0,
                    fontSize: '18px'
                }}>
                    DAW Grid Test
                </h1>
            </div>

            {/* 主要內容區域 */}
            <div style={{
                flex: 1,
                padding: '20px',
                overflow: 'hidden'
            }}>
                <DAWGridView
                    width={1200}
                    height={600}
                    gridSize={40}
                    backgroundColor={0x1a1a1a}
                    gridColor={0x3a3a3a}
                />
            </div>
        </div>
    );
}; 
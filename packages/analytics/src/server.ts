/**
 * BRANDLY Analytics Dashboard Server
 * Real-time TikTok Shop Analytics & Creator Economy Metrics
 * Created by Rubim IA - 2026
 */

import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';
import TikTokAnalytics from './tiktok-analytics.js';

const app = express();
const PORT = process.env.PORT || 3003;
const WS_PORT = process.env.WS_PORT || 3004;

// Initialize analytics engine
const analytics = new TikTokAnalytics();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/dashboard', (req, res) => {
  try {
    const data = analytics.getDashboardData();
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/campaigns', (req, res) => {
  try {
    const campaigns = analytics.getAllCampaigns();
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/campaigns/:id', (req, res) => {
  try {
    const campaign = analytics.getCampaignMetrics(req.params.id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/creators', (req, res) => {
  try {
    const creators = analytics.getAllCreators();
    res.json({
      success: true,
      data: creators
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/creators/:username', (req, res) => {
  try {
    const creator = analytics.getCreatorProfile(req.params.username);
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }
    
    res.json({
      success: true,
      data: creator
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/realtime', (req, res) => {
  try {
    const metrics = analytics.getRealTimeMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/insights/:campaignId', (req, res) => {
  try {
    const insights = analytics.getAudienceInsights(req.params.campaignId);
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/export/:format', (req, res) => {
  try {
    const format = req.params.format as 'json' | 'csv';
    if (format !== 'json' && format !== 'csv') {
      return res.status(400).json({
        success: false,
        error: 'Format must be json or csv'
      });
    }
    
    const data = analytics.exportData(format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=tiktok-analytics.csv');
      res.send(data);
    } else {
      res.json({
        success: true,
        data: JSON.parse(data)
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Revenue prediction
app.post('/api/predict-revenue', (req, res) => {
  try {
    const { campaignId, days = 30 } = req.body;
    const prediction = analytics.predictRevenue(campaignId, days);
    
    res.json({
      success: true,
      data: {
        campaignId,
        days,
        predicted_revenue: prediction,
        confidence: 0.85,
        factors: [
          'Historical performance',
          'Seasonal trends',
          'Audience engagement'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Dashboard HTML
app.get('/', (req, res) => {
  res.send(generateDashboardHTML());
});

// WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`📡 WebSocket server rodando na porta ${WS_PORT}`);

wss.on('connection', (ws) => {
  console.log(`🔌 Cliente conectado (total: ${wss.clients.size})`);
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'welcome',
    data: {
      platform: 'BRANDLY Analytics',
      timestamp: new Date().toISOString()
    }
  }));
  
  ws.on('close', () => {
    console.log(`🔌 Cliente desconectado (total: ${wss.clients.size})`);
  });
});

// Broadcast real-time updates every 15 seconds
setInterval(() => {
  const realTimeMetrics = analytics.getRealTimeMetrics();
  const message = JSON.stringify({
    type: 'realtime-update',
    data: realTimeMetrics,
    timestamp: new Date().toISOString()
  });
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}, 15000);

function generateDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BRANDLY - TikTok Shop Analytics</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff; 
            min-height: 100vh;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; padding: 40px 0; }
        .header h1 { 
            font-size: 3.5em; 
            margin-bottom: 10px; 
            text-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .header p { color: rgba(255,255,255,0.8); font-size: 1.3em; }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
            gap: 25px; 
            margin-bottom: 40px; 
        }
        .card { 
            background: rgba(255,255,255,0.15); 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 20px; 
            padding: 30px; 
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .card:hover { transform: translateY(-5px); }
        .card h3 { 
            color: #fff; 
            margin-bottom: 20px; 
            font-size: 1.5em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .metric { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 15px;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .metric span:first-child { color: rgba(255,255,255,0.8); }
        .metric span:last-child { 
            color: #fff; 
            font-weight: bold; 
            font-size: 1.1em;
        }
        .big-number { 
            font-size: 2.5em; 
            font-weight: bold; 
            text-align: center; 
            margin: 20px 0; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .status { 
            padding: 6px 15px; 
            border-radius: 25px; 
            font-size: 0.85em; 
            font-weight: bold; 
            text-transform: uppercase;
        }
        .status.active { background: rgba(39, 174, 96, 0.8); }
        .status.paused { background: rgba(241, 196, 15, 0.8); }
        .status.completed { background: rgba(52, 152, 219, 0.8); }
        .chart-container { 
            height: 250px; 
            background: rgba(255,255,255,0.1); 
            border-radius: 15px; 
            padding: 20px; 
            margin: 20px 0; 
        }
        .btn { 
            background: rgba(255,255,255,0.2); 
            color: white; 
            border: 2px solid rgba(255,255,255,0.3);
            padding: 12px 25px; 
            border-radius: 25px; 
            cursor: pointer; 
            font-weight: bold; 
            margin: 5px; 
            transition: all 0.3s ease;
        }
        .btn:hover { 
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .websocket-indicator { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            padding: 10px 20px; 
            border-radius: 25px; 
            font-weight: bold; 
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .websocket-indicator.connected { 
            background: rgba(39, 174, 96, 0.9);
            box-shadow: 0 0 20px rgba(39, 174, 96, 0.3);
        }
        .websocket-indicator.disconnected { 
            background: rgba(231, 76, 60, 0.9);
            box-shadow: 0 0 20px rgba(231, 76, 60, 0.3);
        }
        .pulse { 
            width: 12px; 
            height: 12px; 
            border-radius: 50%; 
            background: currentColor; 
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .real-time-updates { 
            position: fixed; 
            bottom: 20px; 
            right: 20px; 
            max-width: 350px;
            background: rgba(0,0,0,0.8);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .update-item {
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            font-size: 0.9em;
        }
        .update-item:last-child {
            border-bottom: none;
        }
        .update-time {
            color: rgba(255,255,255,0.6);
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <div class="websocket-indicator" id="ws-indicator">
        <div class="pulse"></div>
        Conectando...
    </div>

    <div class="container">
        <div class="header">
            <h1>🚀 BRANDLY</h1>
            <p>TikTok Shop Analytics & Creator Economy Dashboard</p>
        </div>

        <div class="grid">
            <!-- Revenue Summary -->
            <div class="card">
                <h3>💰 Receita Total</h3>
                <div class="big-number" id="total-revenue">R$ 0</div>
                <div class="metric">
                    <span>ROAS:</span>
                    <span id="roas">0.00x</span>
                </div>
                <div class="metric">
                    <span>Lucro:</span>
                    <span id="profit">R$ 0</span>
                </div>
            </div>

            <!-- Real-time Metrics -->
            <div class="card">
                <h3>⚡ Tempo Real</h3>
                <div id="realtime-metrics">Carregando...</div>
                <button class="btn" onclick="refreshRealTime()">Atualizar</button>
            </div>

            <!-- Campaign Performance -->
            <div class="card">
                <h3>📊 Campanhas Ativas</h3>
                <div id="campaigns-list">Carregando...</div>
            </div>

            <!-- Top Products -->
            <div class="card">
                <h3>🏆 Top Produtos</h3>
                <div id="top-products">Carregando...</div>
            </div>

            <!-- Creator Performance -->
            <div class="card">
                <h3>👨‍💼 Creators</h3>
                <div id="creators-list">Carregando...</div>
            </div>

            <!-- Performance Chart -->
            <div class="card">
                <h3>📈 Tendências</h3>
                <div class="chart-container">
                    <canvas id="trendsChart" width="300" height="200"></canvas>
                </div>
            </div>
        </div>
    </div>

    <div class="real-time-updates" id="real-time-updates">
        <h4 style="margin-bottom: 15px;">📡 Updates em Tempo Real</h4>
        <div id="updates-list"></div>
    </div>

    <script>
        let ws;
        let dashboardData = {};
        
        // WebSocket Connection
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${WS_PORT}');
            
            ws.onopen = function() {
                document.getElementById('ws-indicator').innerHTML = '<div class="pulse"></div>Conectado';
                document.getElementById('ws-indicator').className = 'websocket-indicator connected';
                addUpdate('🔌 Conectado ao servidor');
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                if (message.type === 'realtime-update') {
                    updateRealTimeMetrics(message.data);
                    addUpdate('📊 Métricas atualizadas');
                }
            };
            
            ws.onclose = function() {
                document.getElementById('ws-indicator').innerHTML = '<div class="pulse"></div>Desconectado';
                document.getElementById('ws-indicator').className = 'websocket-indicator disconnected';
                addUpdate('🔌 Desconectado - tentando reconectar...');
                setTimeout(connectWebSocket, 5000);
            };
        }

        // API Functions
        async function fetchData(endpoint) {
            try {
                const response = await fetch(\`/api\${endpoint}\`);
                return await response.json();
            } catch (error) {
                console.error(\`Erro ao buscar \${endpoint}:\`, error);
                return null;
            }
        }

        async function loadDashboard() {
            const data = await fetchData('/dashboard');
            if (data?.success) {
                dashboardData = data.data;
                updateDashboard();
            }
        }

        function updateDashboard() {
            // Update revenue summary
            document.getElementById('total-revenue').textContent = 
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                    .format(dashboardData.summary.total_revenue);
            
            document.getElementById('roas').textContent = 
                dashboardData.summary.roas.toFixed(2) + 'x';
            
            document.getElementById('profit').textContent = 
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                    .format(dashboardData.summary.profit);

            // Update campaigns
            const campaignsHtml = dashboardData.campaigns.map(campaign => \`
                <div class="metric">
                    <span>\${campaign.name}</span>
                    <span class="status \${campaign.status}">\${campaign.status}</span>
                </div>
                <div class="metric">
                    <span>Receita:</span>
                    <span>\${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(campaign.metrics.revenue)}</span>
                </div>
                <div class="metric">
                    <span>Conversões:</span>
                    <span>\${campaign.conversions}</span>
                </div>
                <hr style="margin: 15px 0; border: 1px solid rgba(255,255,255,0.1);">
            \`).join('');
            
            document.getElementById('campaigns-list').innerHTML = campaignsHtml;

            // Update top products
            const productsHtml = dashboardData.top_products.slice(0, 3).map(item => \`
                <div class="metric">
                    <span>\${item.product.name}</span>
                    <span>\${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.revenue)}</span>
                </div>
            \`).join('');
            
            document.getElementById('top-products').innerHTML = productsHtml;

            // Update creators
            const creatorsHtml = dashboardData.creators.map(creator => \`
                <div class="metric">
                    <span>\${creator.username}</span>
                    <span>\${creator.followers.toLocaleString()} seguidores</span>
                </div>
                <div class="metric">
                    <span>Receita Total:</span>
                    <span>\${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(creator.total_revenue)}</span>
                </div>
            \`).join('');
            
            document.getElementById('creators-list').innerHTML = creatorsHtml;
        }

        function updateRealTimeMetrics(metrics) {
            const html = \`
                <div class="metric">
                    <span>Views:</span>
                    <span>\${metrics.views.toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span>Likes:</span>
                    <span>\${metrics.likes.toLocaleString()}</span>
                </div>
                <div class="metric">
                    <span>Taxa Engajamento:</span>
                    <span>\${metrics.engagement_rate.toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span>Receita:</span>
                    <span>\${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.revenue)}</span>
                </div>
            \`;
            
            document.getElementById('realtime-metrics').innerHTML = html;
        }

        function refreshRealTime() {
            fetchData('/realtime').then(data => {
                if (data?.success) {
                    updateRealTimeMetrics(data.data);
                    addUpdate('🔄 Métricas atualizadas manualmente');
                }
            });
        }

        function addUpdate(message) {
            const updatesList = document.getElementById('updates-list');
            const timestamp = new Date().toLocaleTimeString();
            
            const updateDiv = document.createElement('div');
            updateDiv.className = 'update-item';
            updateDiv.innerHTML = \`
                <div>\${message}</div>
                <div class="update-time">\${timestamp}</div>
            \`;
            
            updatesList.insertBefore(updateDiv, updatesList.firstChild);
            
            // Keep only last 5 updates
            while (updatesList.children.length > 5) {
                updatesList.removeChild(updatesList.lastChild);
            }
        }

        // Initialize
        connectWebSocket();
        loadDashboard();
        
        // Auto-refresh every 2 minutes
        setInterval(loadDashboard, 120000);
    </script>
</body>
</html>`;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BRANDLY Analytics Dashboard rodando em http://localhost:${PORT}`);
  console.log('📊 TikTok Shop Analytics ativo');
  console.log('🎯 Creator Economy monitoring iniciado');
});
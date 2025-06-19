require('dotenv').config();


const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const supabase = require('./supabaseClient');
const generateCaption = require('./utils/gemini');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
const USER_ID = 'cyberpunk420';

app.post('/memes', async (req, res) => {
  const { title, image_url, tags } = req.body;
  const { data, error } = await supabase
    .from('memes')
    .insert([{ title, image_url, tags, upvotes: 0, owner_id: USER_ID }])
    .select();

  if (error) return res.status(500).json({ error });

  const caption = await generateCaption(tags);
  await supabase.from('memes').update({ caption }).eq('id', data[0].id);

  res.json({ ...data[0], caption });
});

app.post('/memes/:id/vote', async (req, res) => {
  const meme_id = req.params.id;
  const { type } = req.body;
  const increment = type === 'up' ? 1 : -1;

  const { error } = await supabase.rpc('adjust_upvotes', { meme_id, inc: increment });
  if (error) return res.status(500).json({ error });

  io.emit('vote-update', { meme_id, type });
  res.json({ success: true });
});

app.post('/memes/:id/bid', async (req, res) => {
  const meme_id = req.params.id;
  const { credits } = req.body;
  const USER_ID = 'cyberpunk420'; // mock user for now

  const { error } = await supabase
    .from('bids')
    .insert([{ meme_id, user_id: USER_ID, credits }]);

  if (error) return res.status(500).json({ error });

  io.emit('new-bid', { meme_id, user_id: USER_ID, credits });
  res.json({ success: true });
});


app.get('/leaderboard', async (req, res) => {
  const { data, error } = await supabase
    .from('memes')
    .select('*')
    .order('upvotes', { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.delete('/memes/:id', async (req, res) => {
  const meme_id = req.params.id;

  const { error } = await supabase
    .from('memes')
    .delete()
    .eq('id', meme_id);

  if (error) return res.status(500).json({ error });

  res.json({ success: true });
});



io.on('connection', (socket) => {
  console.log(' A user connected');
});

server.listen(5000, () => console.log('Server running on http://localhost:5000'));



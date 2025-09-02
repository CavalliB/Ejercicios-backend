
const express = require("express");
const app = express();
require("dotenv").config();
module.exports = app;
var morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');

// Configura Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const people = createClient(supabaseUrl, supabaseKey);
app.use(express.json());

morgan.token("body", (req) => JSON.stringify(req.body));
app.use(morgan(":method :url :status :res[content-length] - :response-time ms :body"));

app.get("/info", async (request, response) => {
  const { data, error } = await people.from('people').select();
  if (error) return response.status(500).json({ error: error.message });
  response.send(
    `<p>Phonebook has info for ${data.length} People</p>${Date()} <p> </p>`
  );
});


app.get("/api/persons", async (request, response) => {
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);

  try {
    const { data, error } = await people.from('people').select();
    console.log('Consulta GET /api/persons:', { data, error });
    if (error) return response.status(500).json({ error: error.message });
    response.json(data);
  } catch (err) {
    console.error('Error inesperado en GET /api/persons:', err);
    response.status(500).json({ error: 'Error inesperado' });
  }
});

app.get("/api/persons/:id", async (request, response) => {
  const id = Number(request.params.id);
  const { data, error } = await people.from('people').select().eq('id', id).single();
  if (error || !data) return response.status(404).end();
  response.json(data);
});

app.delete("/api/persons/:id", async (request, response) => {
  const id = Number(request.params.id);
  const { error } = await people.from('people').delete().eq('id', id);
  if (error) return response.status(500).json({ error: error.message });
  response.status(204).end();
});

app.post("/api/persons", async (request, response) => {
  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: "name or number missing",
    });
  }

  try {
    // Verifica unicidad
    const { data: existing, error: findError } = await people
      .from('people')
      .select()
      .eq('name', body.name)
      .single();
    console.log('Verificando unicidad:', { existing, findError });

    if (findError && findError.code !== 'PGRST116') {
      return response.status(500).json({ error: findError.message });
    }
    if (existing) {
      return response.status(400).json({
        error: "name must be unique",
      });
    }

    const { data, error } = await people
      .from('people')
      .insert([{ name: body.name, number: body.number }])
      .select()
      .single();
    console.log('Insertando persona:', { data, error });

    if (error) return response.status(500).json({ error: error.message });
    response.json(data);
  } catch (err) {
    console.error('Error inesperado en POST /api/persons:', err);
    response.status(500).json({ error: 'Error inesperado' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

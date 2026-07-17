require "json"
require "net/http"
require "uri"

API_URL = "https://saiyanworld-rankingapi-production.up.railway.app/api/ranking"
FILE = "ranking.json"

# Baixa o ranking da API
uri = URI(API_URL)
response = Net::HTTP.get(uri)
data = JSON.parse(response)

# API retorna: { "players": { "id": {...}, ... } }
players_hash = data["players"] || {}

# Converte hash → array
players = players_hash.values

# Ordena por score
players.sort_by! { |p| -p["score"].to_i }

# Limita a 15
players = players.first(15)

# Salva no ranking.json
File.write(FILE, JSON.pretty_generate(players))

puts "Ranking atualizado com sucesso!"
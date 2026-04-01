-- Adiciona coluna has_purchased na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_purchased BOOLEAN DEFAULT false;

-- Marca compradores existentes (planilha de vendas)
UPDATE users SET has_purchased = true WHERE email IN (
  'lucianodeschamps74@gmail.com',
  'gisa_branco27@hotmail.com',
  'anapaula.correa38@gmail.com',
  'acacialuizaleao@gmail.com',
  'lianna.dolar@gmail.com',
  'eujoicisouza@gmail.com'
);

-- Admin sempre tem acesso
UPDATE users SET has_purchased = true WHERE role = 'admin';

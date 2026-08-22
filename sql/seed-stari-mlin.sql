-- ============================================================================
-- Foodlyn — Тест подаци за демо ресторан "Стари Млин"
-- ============================================================================
-- Унос: ресторан, мени са категоријама и модификаторима, столови, особље и
-- симулиране наруџбине за последњих ~18 месеци (од прошле године до данас).
-- Сви експлицитни ИД-ови су ≥ 101 да не дођу у судар са постојећим подацима.
-- Подаци се само додају, ништа не брише и не мења из претходног стања.
--
-- Корисничко име/лозинка за свако особље:
--   корисничко име: видети у табели users испод
--   лозинка:       password
--   хеш лозинке:   $2a$11$LjHkIiKPqfHN/lzsdKzzOOPW4vKX2BtHj4v0cS.raznOZTxkb7rSq
--
-- Покретање:
--   psql -h <host> -U <user> -d foodlyn -f seed-stari-mlin.sql
-- ============================================================================

-- Обезбеди да je `pgcrypto` доступан због функције `gen_random_uuid()`.
-- На PostgreSQL 13+ ова функција је уграђена и наредба испод не ради ништа.
-- На старијим верзијама екстензија је потребна. Ако корисничка улога нема
-- овлашћење за креирање екстензија, ову линију можеш закоментарисати ако
-- си већ инсталирао екстензију мануелно (или си на верзији 13+).
SET client_encoding = 'UTF8';

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Ресторан и радно време
-- ----------------------------------------------------------------------------

INSERT INTO restaurants (
    "Id", "Name", "Slug", "Description", "Email", "PhoneNumber", "Website",
    "StreetAddress", "City", "PostalCode", "Country", "Latitude", "Longitude",
    "LogoUrl", "CoverImageUrl", "Currency", "TimeZone", "Cuisine", "TaxId",
    "IsActive", "CreatedAt"
) VALUES (
    101, 'Стари Млин', 'stari-mlin',
    'Породични ресторан у срцу Крагујевца, познат по балканским специјалитетима, домаћој атмосфери и пицама из камене пећи.',
    'kontakt@starimlin.rs', '+381 34 555 1010', 'https://starimlin.rs',
    'Краља Александра 12', 'Крагујевац', '34000', 'Србија', 44.017900, 20.909700,
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
    'RSD', 'Europe/Belgrade', 'Балкан', '108456789', TRUE, NOW() - INTERVAL '600 days'
);

INSERT INTO restaurant_opening_hours ("Id", "RestaurantId", "DayOfWeek", "IsOpen", "OpenTime", "CloseTime", "CreatedAt") VALUES
    (101, 101, 0, TRUE, '09:00', '23:00', NOW() - INTERVAL '600 days'),
    (102, 101, 1, TRUE, '08:00', '23:00', NOW() - INTERVAL '600 days'),
    (103, 101, 2, TRUE, '08:00', '23:00', NOW() - INTERVAL '600 days'),
    (104, 101, 3, TRUE, '08:00', '23:00', NOW() - INTERVAL '600 days'),
    (105, 101, 4, TRUE, '08:00', '23:00', NOW() - INTERVAL '600 days'),
    (106, 101, 5, TRUE, '08:00', '00:00', NOW() - INTERVAL '600 days'),
    (107, 101, 6, TRUE, '09:00', '00:00', NOW() - INTERVAL '600 days');

-- ----------------------------------------------------------------------------
-- 2. Платформски администратор и особље ресторана
-- (лозинка за све: foodlyn123)
-- ----------------------------------------------------------------------------

-- Платформски администратор (без везе са ресторанима)
INSERT INTO users (
    "Id", "RestaurantId", "FirstName", "LastName", "Email", "Username", "PasswordHash",
    "Role", "IsActive", "IsEmailVerified", "ProfilePictureUrl", "CreatedAt"
) VALUES
    (110, NULL, 'Foodlyn', 'Admin', 'fadmin@foodlyn.rs', 'fadmin', '$2a$11$LjHkIiKPqfHN/lzsdKzzOOPW4vKX2BtHj4v0cS.raznOZTxkb7rSq', 'SuperAdmin', TRUE, TRUE, NULL, NOW() - INTERVAL '600 days');

-- Особље ресторана „Стари Млин"
INSERT INTO users (
    "Id", "RestaurantId", "FirstName", "LastName", "Email", "Username", "PasswordHash",
    "Role", "IsActive", "IsEmailVerified", "ProfilePictureUrl", "CreatedAt"
) VALUES
    (101, 101, 'Никола',  'Петровић',   'menadzer@starimlin.rs',  'menadzer.starimlin', '$2a$11$LjHkIiKPqfHN/lzsdKzzOOPW4vKX2BtHj4v0cS.raznOZTxkb7rSq', 'Manager',       TRUE, TRUE, NULL, NOW() - INTERVAL '590 days'),
    (102, 101, 'Марко',   'Илић',       'kasir1@starimlin.rs',    'kasir1.starimlin',   '$2a$11$LjHkIiKPqfHN/lzsdKzzOOPW4vKX2BtHj4v0cS.raznOZTxkb7rSq', 'Cashier',       TRUE, TRUE, NULL, NOW() - INTERVAL '580 days'),
    (103, 101, 'Ивана',   'Стевановић', 'kasir2@starimlin.rs',    'kasir2.starimlin',   '$2a$11$LjHkIiKPqfHN/lzsdKzzOOPW4vKX2BtHj4v0cS.raznOZTxkb7rSq', 'Cashier',       TRUE, TRUE, NULL, NOW() - INTERVAL '300 days'),
    (104, 101, 'Стефан',  'Јовановић',  'kuvar1@starimlin.rs',    'kuvar1.starimlin',   '$2a$11$LjHkIiKPqfHN/lzsdKzzOOPW4vKX2BtHj4v0cS.raznOZTxkb7rSq', 'Cook',          TRUE, TRUE, NULL, NOW() - INTERVAL '585 days'),
    (105, 101, 'Андреја', 'Симић',      'kuvar2@starimlin.rs',    'kuvar2.starimlin',   '$2a$11$LjHkIiKPqfHN/lzsdKzzOOPW4vKX2BtHj4v0cS.raznOZTxkb7rSq', 'Cook',          TRUE, TRUE, NULL, NOW() - INTERVAL '290 days'),
    (106, 101, 'Милица',  'Радовић',    'konobar1@starimlin.rs',  'konobar1.starimlin', '$2a$11$LjHkIiKPqfHN/lzsdKzzOOPW4vKX2BtHj4v0cS.raznOZTxkb7rSq', 'Waiter',        TRUE, TRUE, NULL, NOW() - INTERVAL '585 days'),
    (107, 101, 'Лука',    'Митровић',   'konobar2@starimlin.rs',  'konobar2.starimlin', '$2a$11$LjHkIiKPqfHN/lzsdKzzOOPW4vKX2BtHj4v0cS.raznOZTxkb7rSq', 'Waiter',        TRUE, TRUE, NULL, NOW() - INTERVAL '500 days'),
    (108, 101, 'Ана',     'Стојановић', 'konobar3@starimlin.rs',  'konobar3.starimlin', '$2a$11$LjHkIiKPqfHN/lzsdKzzOOPW4vKX2BtHj4v0cS.raznOZTxkb7rSq', 'Waiter',        TRUE, TRUE, NULL, NOW() - INTERVAL '250 days'),
    (109, 101, 'Кухињски','Дисплеј',    'status@starimlin.rs',    'status.starimlin',   '$2a$11$LjHkIiKPqfHN/lzsdKzzOOPW4vKX2BtHj4v0cS.raznOZTxkb7rSq', 'StatusDisplay', TRUE, TRUE, NULL, NOW() - INTERVAL '580 days');

INSERT INTO restaurant_assignments ("UserId", "RestaurantId", "CreatedAt") VALUES
    (101, 101, NOW() - INTERVAL '590 days'),
    (102, 101, NOW() - INTERVAL '580 days'),
    (103, 101, NOW() - INTERVAL '300 days'),
    (104, 101, NOW() - INTERVAL '585 days'),
    (105, 101, NOW() - INTERVAL '290 days'),
    (106, 101, NOW() - INTERVAL '585 days'),
    (107, 101, NOW() - INTERVAL '500 days'),
    (108, 101, NOW() - INTERVAL '250 days'),
    (109, 101, NOW() - INTERVAL '580 days');

-- ----------------------------------------------------------------------------
-- 3. Столови (10 столова, разне локације и капацитети)
-- ----------------------------------------------------------------------------

INSERT INTO restaurant_tables (
    "Id", "RestaurantId", "Number", "Label", "Capacity", "Location", "Notes",
    "Status", "CurrentPartySize", "QrToken", "IsActive", "CreatedAt"
) VALUES
    (101, 101,  1, 'Поред улаза', 2, 'Унутра, доле', NULL,            'Free', 0, gen_random_uuid(), TRUE, NOW() - INTERVAL '580 days'),
    (102, 101,  2, NULL,          2, 'Унутра, доле', NULL,            'Free', 0, gen_random_uuid(), TRUE, NOW() - INTERVAL '580 days'),
    (103, 101,  3, NULL,          4, 'Унутра, доле', NULL,            'Free', 0, gen_random_uuid(), TRUE, NOW() - INTERVAL '580 days'),
    (104, 101,  4, 'Угаони',      4, 'Унутра, доле', NULL,            'Free', 0, gen_random_uuid(), TRUE, NOW() - INTERVAL '580 days'),
    (105, 101,  5, NULL,          6, 'Унутра, доле', 'Веће друштво',  'Free', 0, gen_random_uuid(), TRUE, NOW() - INTERVAL '580 days'),
    (106, 101,  6, 'Балкон 1',    2, 'Балкон',       NULL,            'Free', 0, gen_random_uuid(), TRUE, NOW() - INTERVAL '580 days'),
    (107, 101,  7, 'Балкон 2',    4, 'Балкон',       NULL,            'Free', 0, gen_random_uuid(), TRUE, NOW() - INTERVAL '580 days'),
    (108, 101,  8, 'Тераса 1',    4, 'Тераса',       NULL,            'Free', 0, gen_random_uuid(), TRUE, NOW() - INTERVAL '580 days'),
    (109, 101,  9, 'Тераса 2',    6, 'Тераса',       NULL,            'Free', 0, gen_random_uuid(), TRUE, NOW() - INTERVAL '580 days'),
    (110, 101, 10, 'VIP кабина',  8, 'Спрат',        'VIP сепаре',    'Free', 0, gen_random_uuid(), TRUE, NOW() - INTERVAL '580 days');

-- ----------------------------------------------------------------------------
-- 4. Мени и категорије
-- ----------------------------------------------------------------------------

INSERT INTO menus (
    "Id", "RestaurantId", "Name", "Description", "ImageUrl", "BannerImageUrl",
    "SortOrder", "IsActive", "IsPublished", "CreatedAt"
) VALUES (
    101, 101, 'Главни мени',
    'Целогодишњи мени ресторана Стари Млин.',
    NULL, NULL, 0, TRUE, TRUE, NOW() - INTERVAL '575 days'
);

INSERT INTO menu_categories (
    "Id", "RestaurantId", "MenuId", "Name", "Description", "ImageUrl", "Icon",
    "SortOrder", "IsActive", "CreatedAt"
) VALUES
    (101, 101, 101, 'Доручак',           'Класични и савремени укуси за почетак дана.',                'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600', 'pi-sun',             0, TRUE, NOW() - INTERVAL '575 days'),
    (102, 101, 101, 'Палачинке',         'Тањир пун палачинки, на ваш избор преливи и шлаг.',         'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600', 'pi-circle',          1, TRUE, NOW() - INTERVAL '575 days'),
    (103, 101, 101, 'Предјела',          'Лагана јела за отварање апетита.',                           'https://images.unsplash.com/photo-1626082896492-766af4eb6501?w=600', 'pi-star',            2, TRUE, NOW() - INTERVAL '575 days'),
    (104, 101, 101, 'Салате',            'Свеже и сезонске салате.',                                   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', 'pi-th-large',        3, TRUE, NOW() - INTERVAL '575 days'),
    (105, 101, 101, 'Супе и чорбе',      'Класичне домаће супе.',                                      'https://images.unsplash.com/photo-1547592180-85f173990554?w=600', 'pi-bookmark',        4, TRUE, NOW() - INTERVAL '575 days'),
    (106, 101, 101, 'Главна јела',       'Меса са роштиља и кувана јела.',                             'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', 'pi-shopping-cart',   5, TRUE, NOW() - INTERVAL '575 days'),
    (107, 101, 101, 'Паста и ризото',    'Италијански класици.',                                       'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600', 'pi-heart',           6, TRUE, NOW() - INTERVAL '575 days'),
    (108, 101, 101, 'Пица',              'Танка кора, домаћи парадајз сос.',                           'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600', 'pi-objects-column',  7, TRUE, NOW() - INTERVAL '575 days'),
    (109, 101, 101, 'Бургери',           'Сочни бургери са ручно мљевеним месом.',                     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', 'pi-bolt',            8, TRUE, NOW() - INTERVAL '575 days'),
    (110, 101, 101, 'Деца мени',         'Поједностављена јела за најмлађе.',                          'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600', 'pi-smile',           9, TRUE, NOW() - INTERVAL '575 days'),
    (111, 101, 101, 'Десерти',           'Слатки крај оброка.',                                        'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600', 'pi-heart-fill',     10, TRUE, NOW() - INTERVAL '575 days'),
    (112, 101, 101, 'Безалкохолна пића', 'Освежавајућа пића, сокови и природне лимунаде.',             'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=600', 'pi-cloud',          11, TRUE, NOW() - INTERVAL '575 days');

-- ----------------------------------------------------------------------------
-- 5. Ставке менија (са нутритивним и алергенским ознакама)
-- ----------------------------------------------------------------------------

INSERT INTO menu_items (
    "Id", "RestaurantId", "MenuId", "MenuCategoryId", "Name", "Description", "ShortDescription",
    "ImageUrl", "ThumbnailUrl", "Price", "DiscountedPrice",
    "Calories", "PreparationTimeMinutes", "ServingSizeGrams", "SpicinessLevel",
    "IsVegetarian", "IsVegan", "IsGlutenFree", "IsDairyFree", "IsHalal", "IsKosher",
    "IsFeatured", "IsNew", "IsAvailable", "IsActive",
    "Allergens", "Tags", "Ingredients",
    "StockQuantity", "SortOrder", "CreatedAt"
) VALUES
-- Доручак (категорија 101)
(101, 101, 101, 101, 'Енглески доручак',     'Јаја на око, кобасица, печеница, печени пасуљ, печена паприка и тост.', 'Класичан доручак за гладне.', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600', NULL,  890, NULL, 720, 15, 450, 0, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, TRUE,  FALSE, TRUE, TRUE, ARRAY['јаја','глутен'],     ARRAY['популарно','доручак'],    ARRAY['јаја','кобасица','печеница','пасуљ','паприка','хлеб'],          NULL, 0, NOW() - INTERVAL '575 days'),
(102, 101, 101, 101, 'Омлет са поврћем',     'Три јаја, парадајз, паприка, лук, спанаћ, кашкавал.',                  'Идеалан за вегетаријанце.',   'https://images.unsplash.com/photo-1612966809470-4ae7d5f1c45e?w=600', NULL,  620, NULL, 480, 10, 320, 0, TRUE,  FALSE, TRUE,  FALSE, TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY['јаја','млечни'],     ARRAY['вегетаријанско','доручак'], ARRAY['јаја','парадајз','паприка','лук','спанаћ','кашкавал'],          NULL, 1, NOW() - INTERVAL '575 days'),
(103, 101, 101, 101, 'Овсена каша са воћем', 'Овсене пахуљице у бадемовом млеку, банана, боровница, мед и ораси.',  'Лагано и здраво.',            'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600', NULL,  490, NULL, 380,  8, 350, 0, TRUE,  TRUE,  FALSE, TRUE,  TRUE,  TRUE,  FALSE, TRUE,  TRUE, TRUE, ARRAY['ораси','глутен'],    ARRAY['вегански','здраво','ново'], ARRAY['овсене пахуљице','бадемово млеко','банана','боровница','мед','ораси'], NULL, 2, NOW() - INTERVAL '120 days'),
(104, 101, 101, 101, 'Авокадо тост',         'Багета са куваним авокадом, пошираним јајетом и сезамом.',             'Лаган и моћан.',              'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600', NULL,  690, NULL, 410, 10, 280, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  TRUE,  TRUE,  TRUE, TRUE, ARRAY['јаја','глутен','сезам'], ARRAY['ново','популарно'],     ARRAY['багета','авокадо','јаје','сезам','лимун'],                       NULL, 3, NOW() - INTERVAL '90 days'),

-- Палачинке (категорија 102)
(105, 101, 101, 102, 'Палачинка по жељи',    'Изаберите своје преливе и да ли желите шлаг.',                          'Палачинка у вашем стилу.',    'https://images.unsplash.com/photo-1554520735-0a6b8b6ce8b7?w=600', NULL,  390, NULL, 320, 12, 220, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  TRUE,  FALSE, TRUE, TRUE, ARRAY['јаја','глутен','млечни'], ARRAY['популарно'],               ARRAY['брашно','млеко','јаја'],                                          NULL, 0, NOW() - INTERVAL '575 days'),
(106, 101, 101, 102, 'Палачинка Еурокрем',   'Класична палачинка са Еурокремом и млевеним орасима.',                   'Дечји фаворит.',              'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600', NULL,  450, NULL, 510, 10, 240, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY['јаја','глутен','млечни','ораси'], ARRAY['слатко'],         ARRAY['брашно','млеко','јаја','еурокрем','ораси'],                       NULL, 1, NOW() - INTERVAL '575 days'),
(107, 101, 101, 102, 'Палачинка Сан Ремо',   'Чоколадни прелив, банана, шлаг и млевени бадем.',                        'Италијанска класика.',        'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=600', NULL,  520, NULL, 580, 12, 270, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  TRUE,  FALSE, TRUE, TRUE, ARRAY['јаја','глутен','млечни','ораси'], ARRAY['слатко','популарно'], ARRAY['брашно','млеко','јаја','чоколада','банана','шлаг','бадем'],     NULL, 2, NOW() - INTERVAL '500 days'),
(108, 101, 101, 102, 'Палачинка са сладоледом','Топла палачинка преко куглица сладоледа, са домаћим пеленаном.',       'Топло хладно.',               'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600', NULL,  490, NULL, 620, 10, 260, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  FALSE, TRUE,  TRUE, TRUE, ARRAY['јаја','глутен','млечни'], ARRAY['ново','слатко'],         ARRAY['брашно','млеко','јаја','сладолед','чоколадни сос'],              NULL, 3, NOW() - INTERVAL '80 days'),

-- Предјела (категорија 103)
(109, 101, 101, 103, 'Брускете',             'Топла багета са парадајзем, белим луком и босиљком.',                    'Италијански класик.',         'https://images.unsplash.com/photo-1572441710534-0d7b4b5c0c4b?w=600', NULL,  390, NULL, 280,  8, 180, 0, TRUE,  TRUE,  FALSE, TRUE,  TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY['глутен'],            ARRAY['вегански','лагано'],         ARRAY['багета','парадајз','бели лук','босиљак','маслиново уље'],        NULL, 0, NOW() - INTERVAL '575 days'),
(110, 101, 101, 103, 'Кајмак и проја',       'Домаћи кајмак уз свежу пројку.',                                          'Балканска класика.',          'https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=600', NULL,  450, NULL, 520,  6, 200, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  TRUE,  FALSE, TRUE, TRUE, ARRAY['млечни','глутен'],   ARRAY['популарно','домаће'],        ARRAY['кајмак','кукурузно брашно','јаја','млеко'],                       NULL, 1, NOW() - INTERVAL '575 days'),
(111, 101, 101, 103, 'Пршут и дињa',         'Танке кришке пршута са свежом дињом.',                                    'Лагано предјело.',            'https://images.unsplash.com/photo-1593504049359-74330189a345?w=600', NULL,  690, NULL, 340,  5, 220, 0, FALSE, FALSE, TRUE,  TRUE,  FALSE, FALSE, TRUE,  FALSE, TRUE, TRUE, ARRAY[]::text[],            ARRAY['популарно'],                  ARRAY['пршут','диња'],                                                    NULL, 2, NOW() - INTERVAL '500 days'),
(112, 101, 101, 103, 'Хумус са питом',       'Класичан хумус, маслиново уље, паприка и топла пита.',                  'Вегански класик.',            'https://images.unsplash.com/photo-1580013759032-c96505e24c1f?w=600', NULL,  420, NULL, 380, 10, 240, 1, TRUE,  TRUE,  FALSE, TRUE,  TRUE,  TRUE,  FALSE, TRUE,  TRUE, TRUE, ARRAY['сезам','глутен'],    ARRAY['вегански','ново','здраво'],   ARRAY['леблебија','тахини','маслиново уље','лимун','пита'],             NULL, 3, NOW() - INTERVAL '70 days'),

-- Салате (категорија 104)
(113, 101, 101, 104, 'Цезар салата',         'Зелена салата, парчићи пилетине, пармезан, крутони, цезар прелив.',     'Класична Цезар.',             'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600', NULL,  690, NULL, 480, 10, 380, 0, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, TRUE,  FALSE, TRUE, TRUE, ARRAY['глутен','млечни','јаја'], ARRAY['популарно'],            ARRAY['зелена салата','пилетина','пармезан','крутони','цезар прелив'],  NULL, 0, NOW() - INTERVAL '575 days'),
(114, 101, 101, 104, 'Шопска салата',        'Парадајз, краставац, паприка, црни лук и наструган сир.',               'Свежина у тањиру.',           'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600', NULL,  490, NULL, 240,  5, 350, 0, TRUE,  FALSE, TRUE,  FALSE, TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY['млечни'],            ARRAY['вегетаријанско','лагано'],   ARRAY['парадајз','краставац','паприка','лук','сир'],                    NULL, 1, NOW() - INTERVAL '575 days'),
(115, 101, 101, 104, 'Веганска буда боул',   'Кинуа, авокадо, печена шарга, нохут, спанаћ, тахини прелив.',           'Здрав избор за подне.',       'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600', NULL,  790, NULL, 520, 12, 420, 0, TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE, TRUE, ARRAY['сезам'],             ARRAY['вегански','ново','здраво','истакнуто'], ARRAY['кинуа','авокадо','шаргарепа','нохут','спанаћ','тахини'], NULL, 2, NOW() - INTERVAL '60 days'),
(116, 101, 101, 104, 'Грчка салата',         'Парадајз, краставац, маслине, фета сир, црвени лук и оригано.',         'Мирис Грчке.',                'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600', NULL,  590, NULL, 320,  6, 360, 0, TRUE,  FALSE, TRUE,  FALSE, TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY['млечни'],            ARRAY['вегетаријанско','лагано'],   ARRAY['парадајз','краставац','маслине','фета','лук','оригано'],         NULL, 3, NOW() - INTERVAL '500 days'),

-- Супе и чорбе (категорија 105)
(117, 101, 101, 105, 'Пилећа супа',          'Бистра супа са домаћим резанцима и поврћем.',                            'Топла и крепка.',             'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', NULL,  390, NULL, 220, 10, 350, 0, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, FALSE, FALSE, TRUE, TRUE, ARRAY['глутен','јаја'],     ARRAY['домаће'],                    ARRAY['пилетина','резанци','шаргарепа','перцул','со','бибер'],        NULL, 0, NOW() - INTERVAL '575 days'),
(118, 101, 101, 105, 'Парадајз чорба',       'Кремаста чорба од печеног парадајза са босиљком и крутонима.',          'Идеална зими.',               'https://images.unsplash.com/photo-1547308283-0b00bd5dc94e?w=600', NULL,  390, NULL, 250,  8, 320, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY['млечни','глутен'],   ARRAY['вегетаријанско'],            ARRAY['парадајз','босиљак','павлака','крутони'],                       NULL, 1, NOW() - INTERVAL '500 days'),
(119, 101, 101, 105, 'Печурка крем чорба',   'Свеже шампињоне, павлака, мало белог вина.',                            'Кремасто и пуно укуса.',      'https://images.unsplash.com/photo-1547592180-85f173990554?w=600', NULL,  420, NULL, 290,  8, 320, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  TRUE,  FALSE, TRUE, TRUE, ARRAY['млечни'],            ARRAY['вегетаријанско','истакнуто'], ARRAY['шампињони','павлака','лук','бели лук','тимијан'],                NULL, 2, NOW() - INTERVAL '500 days'),

-- Главна јела (категорија 106)
(120, 101, 101, 106, 'Карађорђева шницла',   'Свињска шницла пуњена кајмаком, у тарталази, са помфритом и салатом.',  'Класика српске кухиње.',      'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600', NULL, 1290, NULL, 950, 25, 550, 0, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, TRUE,  FALSE, TRUE, TRUE, ARRAY['јаја','глутен','млечни'], ARRAY['популарно','домаће'],   ARRAY['свињетина','кајмак','презле','уље','кромпир'],                   NULL, 0, NOW() - INTERVAL '575 days'),
(121, 101, 101, 106, 'Чевапи у лепињи',      '10 ћевапа са лепињом, луком и кајмаком.',                                'Балкан класика.',             'https://images.unsplash.com/photo-1633423956378-d8a82b96e636?w=600', NULL,  990, NULL, 820, 20, 480, 1, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, TRUE,  FALSE, TRUE, TRUE, ARRAY['глутен','млечни'],   ARRAY['популарно','домаће'],        ARRAY['мљевено месо','лук','лепиња','кајмак','паприка'],               NULL, 1, NOW() - INTERVAL '575 days'),
(122, 101, 101, 106, 'Пилећи филе на жару',  'Пилећи филе са домаћим прилогом и салатом.',                            'Лагано и сочно.',             'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600', NULL,  990, NULL, 580, 20, 420, 0, FALSE, FALSE, TRUE,  TRUE,  TRUE,  FALSE, FALSE, FALSE, TRUE, TRUE, ARRAY[]::text[],            ARRAY['здраво','без глутена'],       ARRAY['пилеће бело месо','уље','зачини'],                              NULL, 2, NOW() - INTERVAL '575 days'),
(123, 101, 101, 106, 'Бифтек у бернез сосу', 'Меки бифтек са домаћим бернез сосом и печеним кромпиром.',              'Специјалитет куће.',          'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600', NULL, 2490, NULL, 850, 30, 460, 0, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE,  TRUE,  TRUE, TRUE, ARRAY['јаја','млечни'],     ARRAY['истакнуто','премиум','ново'], ARRAY['говеђи бифтек','маслац','јаја','тарагон','кромпир'],            NULL, 3, NOW() - INTERVAL '40 days'),
(124, 101, 101, 106, 'Пастрмка на жару',     'Пастрмка са печеним кромпиром и блитвом.',                              'За љубитеље рибе.',           'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600', NULL, 1290, NULL, 540, 20, 450, 0, FALSE, FALSE, TRUE,  TRUE,  TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY['риба'],              ARRAY['здраво','без глутена'],       ARRAY['пастрмка','кромпир','блитва','лимун','маслиново уље'],         NULL, 4, NOW() - INTERVAL '500 days'),
(125, 101, 101, 106, 'Сарма са киселим купусом','Класична сарма, послужена са куваним кромпиром.',                     'Бакина рецепта.',             'https://images.unsplash.com/photo-1574984406761-c3a89e5e0e30?w=600', NULL,  890, NULL, 620, 30, 400, 0, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, FALSE, FALSE, TRUE, TRUE, ARRAY[]::text[],            ARRAY['домаће'],                    ARRAY['мљевено месо','кисели купус','пиринач','лук','паприка'],        NULL, 5, NOW() - INTERVAL '300 days'),
(126, 101, 101, 106, 'Веганска мусака',      'Слојеви плавог патлиџана, кромпира и парадајз соса са квиношом.',       'Без меса, са пуно укуса.',     'https://images.unsplash.com/photo-1604908554049-1be7b1f5e3ec?w=600', NULL,  890, NULL, 510, 25, 480, 0, TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  FALSE, TRUE,  TRUE, TRUE, ARRAY[]::text[],            ARRAY['вегански','ново','здраво'],   ARRAY['плави патлиџан','кромпир','парадајз','лук','квиноа'],          NULL, 6, NOW() - INTERVAL '55 days'),

-- Паста и ризото (категорија 107)
(127, 101, 101, 107, 'Карбонара',            'Класична карбонара са пацетом, јајима и пармезаном.',                    'Без павлаке, како треба.',    'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600', NULL,  990, NULL, 680, 18, 380, 0, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, TRUE, TRUE, ARRAY['јаја','глутен','млечни'], ARRAY['популарно','истакнуто'], ARRAY['тестенина','пацета','јаја','пармезан','бибер'],                  NULL, 0, NOW() - INTERVAL '500 days'),
(128, 101, 101, 107, 'Тестенина 4 сира',     'Кремаста тестенина са горгонзолом, моцарелом, пармезаном и кашкавалом.', 'За љубитеље сира.',           'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600', NULL,  990, NULL, 720, 18, 400, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY['глутен','млечни'],   ARRAY['вегетаријанско'],            ARRAY['тестенина','горгонзола','моцарела','пармезан','кашкавал'],       NULL, 1, NOW() - INTERVAL '500 days'),
(129, 101, 101, 107, 'Ризото са печуркама',  'Кремасти арборио пиринач са белим вином и печуркама.',                  'Италијанска класика.',        'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=600', NULL,  890, NULL, 580, 22, 380, 0, TRUE,  FALSE, TRUE,  FALSE, TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY['млечни'],            ARRAY['вегетаријанско','без глутена'], ARRAY['арборио пиринач','шампињони','бело вино','пармезан','маслац'], NULL, 2, NOW() - INTERVAL '500 days'),
(130, 101, 101, 107, 'Pasta arrabbiata',     'Пенне у љутом парадајз сосу са белим луком и чилијем.',                'Љуто и брзо.',                'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=600', NULL,  790, NULL, 520, 15, 380, 3, TRUE,  TRUE,  FALSE, TRUE,  TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY['глутен'],            ARRAY['вегански','љуто'],            ARRAY['пенне','парадајз','бели лук','чили','маслиново уље','босиљак'], NULL, 3, NOW() - INTERVAL '500 days'),

-- Пица (категорија 108)
(131, 101, 101, 108, 'Маргарита',            'Парадајз сос, моцарела и босиљак.',                                      'Италијанска класика.',        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600', NULL,  790, NULL, 720, 15, 450, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  TRUE,  FALSE, TRUE, TRUE, ARRAY['глутен','млечни'],   ARRAY['популарно','вегетаријанско'], ARRAY['брашно','парадајз','моцарела','босиљак','маслиново уље'],     NULL, 0, NOW() - INTERVAL '575 days'),
(132, 101, 101, 108, 'Кваттро формаgi',      'Четири сира: моцарела, горгонзола, пармезан, кашкавал.',                 'Сирасто и кремасто.',         'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600', NULL,  990, NULL, 950, 17, 480, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY['глутен','млечни'],   ARRAY['вегетаријанско'],            ARRAY['брашно','моцарела','горгонзола','пармезан','кашкавал'],         NULL, 1, NOW() - INTERVAL '500 days'),
(133, 101, 101, 108, 'Капричоза',            'Шунка, печурке, артичока, маслине.',                                     'Класичан мешани укус.',       'https://images.unsplash.com/photo-1571066811602-716837d681de?w=600', NULL,  990, NULL, 880, 17, 500, 0, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, TRUE, ARRAY['глутен','млечни'],   ARRAY['популарно'],                  ARRAY['брашно','шунка','шампињони','артичока','маслине','моцарела'],   NULL, 2, NOW() - INTERVAL '575 days'),
(134, 101, 101, 108, 'Дијавола',             'Парадајз сос, моцарела, љута кобасица.',                                 'Љуто и сочно.',               'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600', NULL,  990, NULL, 920, 17, 500, 2, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, TRUE,  FALSE, TRUE, TRUE, ARRAY['глутен','млечни'],   ARRAY['популарно','љуто','истакнуто'], ARRAY['брашно','парадајз','моцарела','љута кобасица'],                NULL, 3, NOW() - INTERVAL '500 days'),

-- Бургери (категорија 109)
(135, 101, 101, 109, 'Класик бургер',        '180g јунећи бургер, кашкавал, парадајз, зелена салата, лук, домаћи сос. Уз додатке по жељи.', 'Бургер у вашем стилу.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', NULL,  890, NULL, 780, 15, 380, 0, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, TRUE,  FALSE, TRUE, TRUE, ARRAY['глутен','млечни'],   ARRAY['популарно'],                  ARRAY['јунетина','земичка','кашкавал','парадајз','салата','лук','сос'], NULL, 0, NOW() - INTERVAL '500 days'),
(136, 101, 101, 109, 'BBQ бургер',           '180g бургер, BBQ сос, чедар, печена сланина, лук на жару.',             'Дим, сос и сир.',             'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600', NULL,  990, NULL, 920, 17, 420, 0, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, TRUE,  FALSE, TRUE, TRUE, ARRAY['глутен','млечни'],   ARRAY['популарно'],                  ARRAY['јунетина','BBQ сос','чедар','сланина','лук'],                   NULL, 1, NOW() - INTERVAL '500 days'),
(137, 101, 101, 109, 'Вегетаријански бургер','Бургер од црног пасуља, авокадо, парадајз, ракулa, тахини сос.',         'Без меса, са пуно укуса.',    'https://images.unsplash.com/photo-1525059696034-4967a729002e?w=600', NULL,  890, NULL, 560, 15, 360, 0, TRUE,  TRUE,  FALSE, TRUE,  TRUE,  TRUE,  FALSE, TRUE,  TRUE, TRUE, ARRAY['глутен','сезам'],    ARRAY['вегански','ново'],            ARRAY['црни пасуљ','земичка','авокадо','парадајз','рукола','тахини'], NULL, 2, NOW() - INTERVAL '50 days'),
(138, 101, 101, 109, 'Двоструки бургер',     '2x180g бургер, дупли кашкавал, парадајз, луко, домаћи сос.',             'За велике апетите.',          'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600', NULL, 1190, NULL,1080, 18, 480, 0, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, TRUE,  FALSE, TRUE, TRUE, ARRAY['глутен','млечни'],   ARRAY['истакнуто'],                  ARRAY['јунетина','земичка','кашкавал','парадајз','лук','сос'],         NULL, 3, NOW() - INTERVAL '500 days'),

-- Деца мени (категорија 110)
(139, 101, 101, 110, 'Пилећи штапићи',       'Похована пилећа прса са помфритом и кечапом.',                          'Деци омиљено.',               'https://images.unsplash.com/photo-1562967914-608f82629710?w=600', NULL,  590, NULL, 480, 12, 300, 0, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, FALSE, FALSE, TRUE, TRUE, ARRAY['глутен','јаја'],     ARRAY['деца'],                       ARRAY['пилеће бело месо','презле','кромпир','кечап'],                  NULL, 0, NOW() - INTERVAL '500 days'),
(140, 101, 101, 110, 'Дечји хамбургер',      'Мали бургер са паприком, парадајзом, кашкавалом и помфритом.',           'Дечји фаворит.',              'https://images.unsplash.com/photo-1571091655789-405127f7b6c0?w=600', NULL,  590, NULL, 520, 12, 320, 0, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, FALSE, FALSE, TRUE, TRUE, ARRAY['глутен','млечни'],   ARRAY['деца'],                       ARRAY['јунетина','земичка','кашкавал','парадајз','паприка','кромпир'], NULL, 1, NOW() - INTERVAL '500 days'),
(141, 101, 101, 110, 'Мини пица',            'Округла пица са парадајз сосом, кашкавалом и шунком.',                  'Класична пица у мини верзији.','https://images.unsplash.com/photo-1565299543923-37dd37887442?w=600', NULL,  490, NULL, 420, 13, 250, 0, FALSE, FALSE, FALSE, FALSE, TRUE,  FALSE, FALSE, FALSE, TRUE, TRUE, ARRAY['глутен','млечни'],   ARRAY['деца'],                       ARRAY['брашно','парадајз','кашкавал','шунка'],                          NULL, 2, NOW() - INTERVAL '500 days'),

-- Десерти (категорија 111)
(142, 101, 101, 111, 'Чизкејк',              'Класичан њујоршки чизкејк са боровницама.',                              'Кремасто и слатко.',          'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600', NULL,  490, NULL, 480,  5, 180, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  TRUE,  FALSE, TRUE, TRUE, ARRAY['глутен','млечни','јаја'], ARRAY['популарно','истакнуто'], ARRAY['крем сир','павлака','бисквит','шећер','боровнице'],              NULL, 0, NOW() - INTERVAL '575 days'),
(143, 101, 101, 111, 'Тирамису',             'Италијански класик са кафом и маскарпоне кремом.',                       'Италијанска класика.',        'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600', NULL,  490, NULL, 520,  5, 200, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  TRUE,  FALSE, TRUE, TRUE, ARRAY['глутен','млечни','јаја'], ARRAY['популарно'],            ARRAY['маскарпоне','јаја','кафа','шећер','пишкоте','какао'],            NULL, 1, NOW() - INTERVAL '575 days'),
(144, 101, 101, 111, 'Воћна салата',         'Свеже сезонско воће и листић нане.',                                     'Лагано и освежавајуће.',      'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=600', NULL,  390, NULL, 180,  5, 220, 0, TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY[]::text[],            ARRAY['вегански','без глутена','здраво'], ARRAY['сезонско воће','нана','лимун'],                                NULL, 2, NOW() - INTERVAL '500 days'),
(145, 101, 101, 111, 'Чоколадни суфле',      'Топли чоколадни суфле са кугла сладоледом од ваниле.',                   'Топло-хладно искуство.',      'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600', NULL,  590, NULL, 560, 15, 220, 0, TRUE,  FALSE, FALSE, FALSE, TRUE,  TRUE,  TRUE,  TRUE,  TRUE, TRUE, ARRAY['глутен','млечни','јаја'], ARRAY['истакнуто','ново'],     ARRAY['тамна чоколада','маслац','јаја','шећер','сладолед'],            NULL, 3, NOW() - INTERVAL '45 days'),

-- Безалкохолна пића (категорија 112)
(146, 101, 101, 112, 'Домаћа лимунада',      'Свеж лимун, нана, мало меда и сода вода.',                              'Освежавајуће.',               'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600', NULL,  290, NULL,  80,  3, 350, 0, TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  FALSE, TRUE, TRUE, ARRAY[]::text[],            ARRAY['вегански','освежавајуће','популарно'], ARRAY['лимун','нана','мед','сода'],                                  NULL, 0, NOW() - INTERVAL '575 days'),
(147, 101, 101, 112, 'Цеђен поморанџин сок', '100% свеж сок од поморанџе.',                                            'Свеже исцеђено.',             'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600', NULL,  390, NULL, 140,  3, 300, 0, TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY[]::text[],            ARRAY['вегански','освежавајуће'],     ARRAY['поморанџа'],                                                       NULL, 1, NOW() - INTERVAL '575 days'),
(148, 101, 101, 112, 'Кока-кола',            '0,33L флаша.',                                                            'Класична газирана.',          'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600', NULL,  220, NULL, 140,  1, 330, 0, FALSE, FALSE, TRUE,  TRUE,  TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY[]::text[],            ARRAY['газирано'],                    ARRAY['кока-кола'],                                                       NULL, 2, NOW() - INTERVAL '575 days'),
(149, 101, 101, 112, 'Минерална вода',       '0,5L флаша.',                                                             'Класична газирана.',          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600', NULL,  150, NULL,   0,  1, 500, 0, TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY[]::text[],            ARRAY['газирано'],                    ARRAY['минерална вода'],                                                  NULL, 3, NOW() - INTERVAL '575 days'),
(150, 101, 101, 112, 'Еспресо',              'Класичан еспресо од 100% арабике.',                                       'Енергија у шољи.',            'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600', NULL,  180, NULL,   5,  3,  30, 0, TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  FALSE, FALSE, TRUE, TRUE, ARRAY[]::text[],            ARRAY['вегански','кафа'],             ARRAY['кафа'],                                                            NULL, 4, NOW() - INTERVAL '575 days');

-- ----------------------------------------------------------------------------
-- 6. Групе модификатора и модификатори
-- (палачинка по жељи, бургер додаци, пица величина)
-- ----------------------------------------------------------------------------

INSERT INTO menu_item_modifier_groups (
    "Id", "RestaurantId", "MenuItemId", "Name", "MinSelect", "MaxSelect", "SortOrder", "IsActive", "CreatedAt"
) VALUES
    (101, 101, 105, 'Преливи',          1, 3, 0, TRUE, NOW() - INTERVAL '575 days'),
    (102, 101, 105, 'Шлаг',              0, 1, 1, TRUE, NOW() - INTERVAL '575 days'),
    (103, 101, 131, 'Величина пице',     1, 1, 0, TRUE, NOW() - INTERVAL '575 days'),
    (104, 101, 135, 'Додаци у бургер',   0, 4, 0, TRUE, NOW() - INTERVAL '575 days');

INSERT INTO menu_item_modifiers (
    "Id", "RestaurantId", "MenuItemModifierGroupId", "Name", "PriceDelta", "IsActive", "SortOrder", "CreatedAt"
) VALUES
    -- Преливи за палачинку (група 101)
    (101, 101, 101, 'Еурокрем',      80,  TRUE, 0, NOW() - INTERVAL '575 days'),
    (102, 101, 101, 'Плазма',        70,  TRUE, 1, NOW() - INTERVAL '575 days'),
    (103, 101, 101, 'Мед',           60,  TRUE, 2, NOW() - INTERVAL '575 days'),
    (104, 101, 101, 'Мармелада',     60,  TRUE, 3, NOW() - INTERVAL '575 days'),
    (105, 101, 101, 'Банана',        70,  TRUE, 4, NOW() - INTERVAL '575 days'),
    (106, 101, 101, 'Чоколадни сос', 80,  TRUE, 5, NOW() - INTERVAL '575 days'),
    (107, 101, 101, 'Лешник',        90,  TRUE, 6, NOW() - INTERVAL '575 days'),
    (108, 101, 101, 'Кокос',         70,  TRUE, 7, NOW() - INTERVAL '575 days'),
    -- Шлаг (група 102)
    (109, 101, 102, 'Са шлагом',     50,  TRUE, 0, NOW() - INTERVAL '575 days'),
    -- Величина пице (група 103)
    (110, 101, 103, 'Мала (28cm)',    0,  TRUE, 0, NOW() - INTERVAL '575 days'),
    (111, 101, 103, 'Средња (33cm)', 200, TRUE, 1, NOW() - INTERVAL '575 days'),
    (112, 101, 103, 'Велика (40cm)', 400, TRUE, 2, NOW() - INTERVAL '575 days'),
    -- Додаци у бургер (група 104)
    (113, 101, 104, 'Додатни кашкавал', 80,  TRUE, 0, NOW() - INTERVAL '575 days'),
    (114, 101, 104, 'Сланина',          120, TRUE, 1, NOW() - INTERVAL '575 days'),
    (115, 101, 104, 'Печурке',          90,  TRUE, 2, NOW() - INTERVAL '575 days'),
    (116, 101, 104, 'Љута паприка',     60,  TRUE, 3, NOW() - INTERVAL '575 days'),
    (117, 101, 104, 'Карамелизовани лук',70, TRUE, 4, NOW() - INTERVAL '575 days');

-- ----------------------------------------------------------------------------
-- 7. Симулиране наруџбине за последњих ~18 месеци
-- Распоред: за сваки од 18 месеци, генерише се између 8 и 15 наруџбина
-- са насумичним столом, бројем ставки (2-5), количинама (1-3) и статусом.
-- Користе се ИД-ови ≥ 201 да би сви тест ИД-ови (101-150) остали невезани.
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_order_id      BIGINT;
    v_item_row_id   BIGINT;
    v_month_offset  INT;
    v_orders_in_month INT;
    v_order_idx     INT;
    v_items_in_order INT;
    v_item_idx      INT;
    v_table_no      INT;
    v_table_id      BIGINT;
    v_table_label   TEXT;
    v_table_party   INT;
    v_payment       INT;
    v_status        INT;
    v_total         NUMERIC(12, 2);
    v_created_at    TIMESTAMPTZ;
    v_day_in_month  INT;
    v_hour          INT;
    v_minute        INT;
    v_approved_at   TIMESTAMPTZ;
    v_prep_started  TIMESTAMPTZ;
    v_ready_at      TIMESTAMPTZ;
    v_served_at     TIMESTAMPTZ;
    v_paid_at       TIMESTAMPTZ;
    v_completed_at  TIMESTAMPTZ;
    v_menu_item     RECORD;
    v_qty           INT;
    v_session_id    TEXT;
BEGIN
    -- Постави бројаче за наруџбине, ставке и модификаторе изнад 200
    PERFORM setval(pg_get_serial_sequence('orders',                'Id'), GREATEST((SELECT COALESCE(MAX("Id"), 0) FROM orders),                200), TRUE);
    PERFORM setval(pg_get_serial_sequence('order_items',           'Id'), GREATEST((SELECT COALESCE(MAX("Id"), 0) FROM order_items),           200), TRUE);
    PERFORM setval(pg_get_serial_sequence('order_item_modifiers',  'Id'), GREATEST((SELECT COALESCE(MAX("Id"), 0) FROM order_item_modifiers),  200), TRUE);

    -- За сваки месец из последњих 18 (0 = текући, 17 = пре 17 месеци)
    FOR v_month_offset IN 0..17 LOOP
        -- Број наруџбина за тај месец (8 до 15)
        v_orders_in_month := 8 + floor(random() * 8)::int;

        FOR v_order_idx IN 1..v_orders_in_month LOOP
            -- Случајан дан, време, сто, начин плаћања
            v_day_in_month := 1 + floor(random() * 27)::int;
            v_hour         := 11 + floor(random() * 11)::int;
            v_minute       := floor(random() * 60)::int;

            v_created_at := date_trunc('month', NOW() - (v_month_offset || ' months')::interval)
                           + ((v_day_in_month - 1) || ' days')::interval
                           + (v_hour || ' hours')::interval
                           + (v_minute || ' minutes')::interval;

            v_table_no    := 1 + floor(random() * 10)::int;
            v_table_id    := 100 + v_table_no;
            SELECT "Label" INTO v_table_label FROM restaurant_tables WHERE "Id" = v_table_id;
            v_table_party := 1 + floor(random() * 4)::int;
            v_payment     := CASE WHEN random() < 0.55 THEN 0 ELSE 1 END;  -- 0 = Card, 1 = Cash
            v_session_id  := substring(md5(random()::text || clock_timestamp()::text), 1, 24);

            -- Статус: 94% завршено, 4% одбијено, 2% отказано (све завршна стања)
            v_status := CASE
                WHEN random() < 0.94 THEN 8  -- Completed
                WHEN random() < 0.98 THEN 2  -- Rejected
                ELSE 6                        -- Cancelled
            END;

            -- Тајминг етапа наруџбине (само за оне који су напредовали)
            v_approved_at  := v_created_at  + INTERVAL '2 minutes';
            v_prep_started := v_approved_at + INTERVAL '1 minutes';
            v_ready_at     := v_prep_started + ((10 + floor(random() * 20)::int) || ' minutes')::interval;
            v_served_at    := v_ready_at    + ((2 + floor(random() * 6)::int)  || ' minutes')::interval;
            v_paid_at      := v_served_at   + ((20 + floor(random() * 70)::int) || ' minutes')::interval;
            v_completed_at := v_paid_at;

            -- Креирај наруџбину (тотал израчунавамо после ставки)
            INSERT INTO orders (
                "RestaurantId", "TableId", "TableNumber", "TableLabel",
                "SessionId", "CustomerName", "Status",
                "DeliveryNotes", "TotalAmount", "Currency", "PartySize",
                "PrepTimeMinutes", "ApprovedAt", "RejectedAt", "RejectedReason",
                "PreparingStartedAt", "ReadyAt", "ServedAt", "CancelledAt",
                "PaidAt", "CompletedAt", "PaymentMethod",
                "ApprovedBy", "PreparedBy", "ServedBy", "PaidBy",
                "CreatedAt", "CreatedBy"
            ) VALUES (
                101, v_table_id, v_table_no, v_table_label,
                v_session_id, NULL, v_status,
                NULL, 0, 'RSD', v_table_party,
                CASE WHEN v_status IN (3,4,5,7,8) THEN 15 + floor(random() * 15)::int ELSE NULL END,
                CASE WHEN v_status IN (1,3,4,5,7,8) THEN v_approved_at  ELSE NULL END,
                CASE WHEN v_status = 2 THEN v_approved_at  ELSE NULL END,
                CASE WHEN v_status = 2 THEN 'Састојак тренутно недоступан' ELSE NULL END,
                CASE WHEN v_status IN (3,4,5,7,8) THEN v_prep_started ELSE NULL END,
                CASE WHEN v_status IN (4,5,7,8) THEN v_ready_at     ELSE NULL END,
                CASE WHEN v_status IN (5,7,8) THEN v_served_at      ELSE NULL END,
                CASE WHEN v_status = 6 THEN v_created_at + INTERVAL '1 minute' ELSE NULL END,
                CASE WHEN v_status = 8 THEN v_paid_at       ELSE NULL END,
                CASE WHEN v_status = 8 THEN v_completed_at  ELSE NULL END,
                CASE WHEN v_status IN (5,7,8) THEN v_payment ELSE NULL END,
                CASE WHEN v_status IN (1,3,4,5,7,8) THEN 102 + floor(random() * 2)::int ELSE NULL END,
                CASE WHEN v_status IN (3,4,5,7,8) THEN 104 + floor(random() * 2)::int ELSE NULL END,
                CASE WHEN v_status IN (5,7,8) THEN 106 + floor(random() * 3)::int ELSE NULL END,
                CASE WHEN v_status = 8 THEN 102 + floor(random() * 2)::int ELSE NULL END,
                v_created_at, NULL
            ) RETURNING "Id" INTO v_order_id;

            -- Ставке наруџбине (2-5 различитих ставки)
            v_items_in_order := 2 + floor(random() * 4)::int;
            v_total := 0;

            FOR v_item_idx IN 1..v_items_in_order LOOP
                -- Узми случајну ставку из менија ресторана 101
                SELECT mi."Id", mi."Name", COALESCE(mi."DiscountedPrice", mi."Price") AS price
                  INTO v_menu_item
                  FROM menu_items mi
                 WHERE mi."RestaurantId" = 101
                 ORDER BY random()
                 LIMIT 1;

                v_qty := 1 + floor(random() * 2)::int;

                INSERT INTO order_items (
                    "OrderId", "MenuItemId", "Name", "Price", "Quantity", "Notes", "CreatedAt"
                ) VALUES (
                    v_order_id, v_menu_item."Id", v_menu_item."Name", v_menu_item.price, v_qty, NULL, v_created_at
                ) RETURNING "Id" INTO v_item_row_id;

                v_total := v_total + (v_menu_item.price * v_qty);
            END LOOP;

            -- Постави укупан износ
            UPDATE orders SET "TotalAmount" = v_total WHERE "Id" = v_order_id;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Креирано наруџбина: %', (SELECT COUNT(*) FROM orders WHERE "RestaurantId" = 101);
END $$;

-- ----------------------------------------------------------------------------
-- 8. Постави бројаче (sequences) изнад максималних ИД-ова, да даљи аутоматски
--    уноси из апликације не упадну у судар са нашим тест подацима
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT 'restaurants'                AS t UNION ALL
        SELECT 'restaurant_opening_hours'         UNION ALL
        SELECT 'restaurant_tables'                UNION ALL
        SELECT 'users'                            UNION ALL
        SELECT 'menus'                            UNION ALL
        SELECT 'menu_categories'                  UNION ALL
        SELECT 'menu_items'                       UNION ALL
        SELECT 'menu_item_modifier_groups'        UNION ALL
        SELECT 'menu_item_modifiers'              UNION ALL
        SELECT 'orders'                           UNION ALL
        SELECT 'order_items'                      UNION ALL
        SELECT 'order_item_modifiers'
    LOOP
        EXECUTE format(
            'SELECT setval(pg_get_serial_sequence(%L, %L), GREATEST((SELECT COALESCE(MAX(%I), 0) FROM %I), 1), TRUE)',
            rec.t, 'Id', 'Id', rec.t
        );
    END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- Кратак сажетак онога што је унето:
--   1 платформски администратор „fadmin" (id=110), лозинка foodlyn123,
--      e-пошта fadmin@foodlyn.rs, без везе за конкретан ресторан.
--   Ресторан „Стари Млин" (id=101) у Крагујевцу, RSD, Europe/Belgrade.
--   9 особља ресторана (id 101-109) лозинка foodlyn123: 1 менаџер, 2 касира,
--      2 кувара, 3 конобара, 1 екран за приказ статуса.
--   10 столова (id 101-110).
--   1 мени са 12 категорија (id 101-112) и 50 ставки (id 101-150).
--   4 групе модификатора (id 101-104) са 17 модификатора (id 101-117).
--   Око 200 наруџбина (id ≥ 201) распоређених кроз последњих 18 месеци.
-- ============================================================================

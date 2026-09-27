# Seed script for Character and Merchandise assets
Add-Type -AssemblyName System.Data
$connString = "Server=SUFYAN\SQLEXPRESS;Database=FanHubPlus;User Id=sa;Password=1234;TrustServerCertificate=True"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
$conn.Open()

Write-Host "Database connected successfully!"

$wwwroot = "C:\Users\sufya\Desktop\tech_wizz\Project\FanHubPlus-code\FanHubPlus\backend\FanHubPlus.Api\wwwroot"
$merchImgDir = Join-Path $wwwroot "media\images\merch"
$charImgDir = Join-Path $wwwroot "media\images\characters"
$articleImgDir = Join-Path $wwwroot "media\images\articles"

if (!(Test-Path $merchImgDir)) { New-Item -ItemType Directory -Path $merchImgDir -Force }
if (!(Test-Path $charImgDir)) { New-Item -ItemType Directory -Path $charImgDir -Force }
if (!(Test-Path $articleImgDir)) { New-Item -ItemType Directory -Path $articleImgDir -Force }

# 1. COPY & STANDARDIZE CHARACTER IMAGES
$charPicSource = Join-Path $wwwroot "character and merchaties\character\pic"
$charMap = @(
    @{ Src = "WhatsApp Image 2026-09-25 at 10.47.36 AM.jpg"; Dest = "tanjiro-kamado-slayer.jpg" },
    @{ Src = "WhatsApp Image 2026-09-25 at 10.47.36 AM (1).jpg"; Dest = "roronoa-zoro-master.jpg" },
    @{ Src = "WhatsApp Image 2026-09-25 at 10.47.37 AM.jpg"; Dest = "dazai-osamu-detective.jpg" },
    @{ Src = "WhatsApp Image 2026-09-25 at 10.47.37 AM (1).jpg"; Dest = "ezio-auditore-assassin.jpg" },
    @{ Src = "WhatsApp Image 2026-09-25 at 10.47.37 AM (2).jpg"; Dest = "itachi-uchiha-shinobi.jpg" },
    @{ Src = "WhatsApp Image 2026-09-25 at 10.47.38 AM.jpg"; Dest = "megumi-fushiguro-shikigami.jpg" },
    @{ Src = "WhatsApp Image 2026-09-25 at 10.47.39 AM.jpg"; Dest = "atreus-loki-ragnarok.jpg" },
    @{ Src = "WhatsApp Image 2026-09-25 at 10.47.39 AM (1).jpg"; Dest = "vergil-devil-may-cry.jpg" },
    @{ Src = "WhatsApp Image 2026-09-25 at 10.47.40 AM.jpg"; Dest = "dante-devil-hunter.jpg" },
    @{ Src = "WhatsApp Image 2026-09-25 at 10.47.40 AM (1).jpg"; Dest = "lara-croft-tomb-raider.jpg" }
)

foreach ($c in $charMap) {
    $srcFile = Join-Path $charPicSource $c.Src
    if (Test-Path $srcFile) {
        Copy-Item -Path $srcFile -Destination (Join-Path $charImgDir $c.Dest) -Force
        Copy-Item -Path $srcFile -Destination (Join-Path $articleImgDir $c.Dest) -Force
        Write-Host "Copied character: $($c.Dest)"
    }
}

# 2. INSERT / UPDATE CHARACTERS
$characters = @(
    @{
        Name = "Tanjiro Kamado"
        Slug = "tanjiro-kamado"
        CategoryId = 1
        Fandom = "Demon Slayer"
        Role = "Demon Hunter"
        Power = "Water Breathing & Hinokami Kagura"
        Quote = "No matter how many people you may lose, you have no choice but to go on living."
        Bio = "A kind-hearted young warrior who joins the Demon Slayer Corps after tragedy strikes his family. Renowned for his compassion, immense determination, and mastery of both Water and Sun Breathing."
        Strength = 88; Intelligence = 84; Agility = 92; Charisma = 90
        Img = "/media/images/characters/tanjiro-kamado-slayer.jpg"
    },
    @{
        Name = "Roronoa Zoro"
        Slug = "roronoa-zoro"
        CategoryId = 1
        Fandom = "One Piece"
        Role = "First Mate & Swordsman"
        Power = "Santoryu (Three-Sword Style) & Conqueror's Haki"
        Quote = "When the world shoves you around, you've just got to stand up and shove back."
        Bio = "The lethal swordsman of the Straw Hat Pirates who wields three katanas simultaneously. His lifelong oath to Kuina drives him to conquer every duel on the path to becoming the World's Greatest Swordsman."
        Strength = 97; Intelligence = 80; Agility = 91; Charisma = 89
        Img = "/media/images/characters/roronoa-zoro-master.jpg"
    },
    @{
        Name = "Dazai Osamu"
        Slug = "dazai-osamu"
        CategoryId = 1
        Fandom = "Bungo Stray Dogs"
        Role = "Detective & Strategist"
        Power = "No Longer Human (Ability Nullification)"
        Quote = "Dispute that which is human, and nullify that which is divine."
        Bio = "A charismatic yet enigmatic senior operative of the Armed Detective Agency. Beneath his whimsical antics lies a formidable tactical intellect capable of unraveling intricate conspiracies in seconds."
        Strength = 75; Intelligence = 99; Agility = 82; Charisma = 96
        Img = "/media/images/characters/dazai-osamu-detective.jpg"
    },
    @{
        Name = "Itachi Uchiha"
        Slug = "itachi-uchiha"
        CategoryId = 1
        Fandom = "Naruto"
        Role = "Rogue Shinobi"
        Power = "Mangekyo Sharingan, Tsukuyomi & Susanoo"
        Quote = "People's lives don't end when they die, it ends when they lose faith."
        Bio = "A prodigious shinobi of the Uchiha clan who shouldered the heaviest burden in ninja history. His extraordinary mastery of genjutsu, calm composure, and profound love for Sasuke define his legend."
        Strength = 92; Intelligence = 98; Agility = 94; Charisma = 91
        Img = "/media/images/characters/itachi-uchiha-shinobi.jpg"
    },
    @{
        Name = "Megumi Fushiguro"
        Slug = "megumi-fushiguro"
        CategoryId = 1
        Fandom = "Jujutsu Kaisen"
        Role = "Grade 2 Sorcerer"
        Power = "Ten Shadows Technique & Chimera Shadow Garden"
        Quote = "I will save people unequally. I am not a hero. I'm a jujutsu sorcerer."
        Bio = "A talented jujutsu sorcerer from the Zen'in bloodline studying at Tokyo Jujutsu High. Using shadows as intermediaries, he summons divine beasts and constructs lethal domain expansions."
        Strength = 87; Intelligence = 93; Agility = 90; Charisma = 86
        Img = "/media/images/characters/megumi-fushiguro-shikigami.jpg"
    },
    @{
        Name = "Ezio Auditore da Firenze"
        Slug = "ezio-auditore"
        CategoryId = 2
        Fandom = "Assassin's Creed"
        Role = "Master Assassin & Mentor"
        Power = "Eagle Vision, Dual Hidden Blades & Free Running"
        Quote = "Nothing is true, everything is permitted."
        Bio = "From a reckless Florentine nobleman to the revered Mentor of the Italian Brotherhood, Ezio dedicated his life to uncovering the Apple of Eden and liberating humanity from Templar tyranny."
        Strength = 91; Intelligence = 94; Agility = 96; Charisma = 98
        Img = "/media/images/characters/ezio-auditore-assassin.jpg"
    },
    @{
        Name = "Atreus (Loki)"
        Slug = "atreus-loki"
        CategoryId = 2
        Fandom = "God of War"
        Role = "Jotunn Champion & Archer"
        Power = "Giant Magic, Runic Archery & Beast Shapeshifting"
        Quote = "We must be better than our predecessors."
        Bio = "Son of Kratos and Laufey the Just, Atreus embraces his prophesied destiny as Loki. Combining deadly runic marksmanship with ancient giant lore, he guides the realms through twilight and rebirth."
        Strength = 88; Intelligence = 95; Agility = 94; Charisma = 91
        Img = "/media/images/characters/atreus-loki-ragnarok.jpg"
    },
    @{
        Name = "Vergil"
        Slug = "vergil"
        CategoryId = 2
        Fandom = "Devil May Cry"
        Role = "Dark Slayer"
        Power = "Yamato, Summoned Swords & Sin Devil Trigger"
        Quote = "Might controls everything, and without strength you cannot protect anything, let alone yourself."
        Bio = "The elder twin son of the Dark Knight Sparda. An uncompromising warrior driven by a singular obsession with supreme demonic power, wielding the dimensional katana Yamato with peerless speed."
        Strength = 99; Intelligence = 96; Agility = 99; Charisma = 93
        Img = "/media/images/characters/vergil-devil-may-cry.jpg"
    },
    @{
        Name = "Dante"
        Slug = "dante"
        CategoryId = 2
        Fandom = "Devil May Cry"
        Role = "Legendary Devil Hunter"
        Power = "Rebellion, Ebony & Ivory, Trickster & Royal Guard"
        Quote = "Devils never cry... these tears are a gift only humans have."
        Bio = "The irrepressible demon-hunting son of Sparda who runs the Devil May Cry agency. Armed with oversized broadswords, dual custom pistols, and unmatched style, he protects the mortal world from hellish incursions."
        Strength = 98; Intelligence = 90; Agility = 98; Charisma = 97
        Img = "/media/images/characters/dante-devil-hunter.jpg"
    },
    @{
        Name = "Lara Croft"
        Slug = "lara-croft"
        CategoryId = 2
        Fandom = "Tomb Raider"
        Role = "Master Archaeologist"
        Power = "Survivalist Instinct, Dual Pistols & Extreme Acrobacy"
        Quote = "The extraordinary is in what we do, not who we are."
        Bio = "A world-renowned British archaeologist, aristocrat, and relentless explorer. Lara braves the most perilous lost tombs, supernatural puzzles, and hostile syndicates to safeguard ancient mysteries."
        Strength = 88; Intelligence = 97; Agility = 95; Charisma = 93
        Img = "/media/images/characters/lara-croft-tomb-raider.jpg"
    }
)

foreach ($ch in $characters) {
    $checkCmd = $conn.CreateCommand()
    $checkCmd.CommandText = "SELECT COUNT(*) FROM CharacterProfiles WHERE Slug = @slug"
    $checkCmd.Parameters.AddWithValue("@slug", $ch.Slug) | Out-Null
    $exists = [int]$checkCmd.ExecuteScalar()

    if ($exists -gt 0) {
        $updCmd = $conn.CreateCommand()
        $updCmd.CommandText = @"
UPDATE CharacterProfiles SET
    Name = @name, CategoryId = @cat, Fandom = @fandom, Role = @role,
    Power = @power, Quote = @quote, Bio = @bio,
    Strength = @str, Intelligence = @intl, Agility = @agi, Charisma = @cha,
    ImageUrl = @img, HoverImageUrl = @img
WHERE Slug = @slug
"@
        $updCmd.Parameters.AddWithValue("@name", $ch.Name) | Out-Null
        $updCmd.Parameters.AddWithValue("@cat", $ch.CategoryId) | Out-Null
        $updCmd.Parameters.AddWithValue("@fandom", $ch.Fandom) | Out-Null
        $updCmd.Parameters.AddWithValue("@role", $ch.Role) | Out-Null
        $updCmd.Parameters.AddWithValue("@power", $ch.Power) | Out-Null
        $updCmd.Parameters.AddWithValue("@quote", $ch.Quote) | Out-Null
        $updCmd.Parameters.AddWithValue("@bio", $ch.Bio) | Out-Null
        $updCmd.Parameters.AddWithValue("@str", $ch.Strength) | Out-Null
        $updCmd.Parameters.AddWithValue("@intl", $ch.Intelligence) | Out-Null
        $updCmd.Parameters.AddWithValue("@agi", $ch.Agility) | Out-Null
        $updCmd.Parameters.AddWithValue("@cha", $ch.Charisma) | Out-Null
        $updCmd.Parameters.AddWithValue("@img", $ch.Img) | Out-Null
        $updCmd.Parameters.AddWithValue("@slug", $ch.Slug) | Out-Null
        $updCmd.ExecuteNonQuery() | Out-Null
        Write-Host "Updated character: $($ch.Name)"
    } else {
        $insCmd = $conn.CreateCommand()
        $insCmd.CommandText = @"
INSERT INTO CharacterProfiles (CategoryId, Name, Slug, Fandom, Role, Power, Quote, Bio, Strength, Intelligence, Agility, Charisma, ImageUrl, HoverImageUrl, ViewCount, PopularityScore, CreatedAt)
VALUES (@cat, @name, @slug, @fandom, @role, @power, @quote, @bio, @str, @intl, @agi, @cha, @img, @img, 15400, 890, GETUTCDATE())
"@
        $insCmd.Parameters.AddWithValue("@cat", $ch.CategoryId) | Out-Null
        $insCmd.Parameters.AddWithValue("@name", $ch.Name) | Out-Null
        $insCmd.Parameters.AddWithValue("@slug", $ch.Slug) | Out-Null
        $insCmd.Parameters.AddWithValue("@fandom", $ch.Fandom) | Out-Null
        $insCmd.Parameters.AddWithValue("@role", $ch.Role) | Out-Null
        $insCmd.Parameters.AddWithValue("@power", $ch.Power) | Out-Null
        $insCmd.Parameters.AddWithValue("@quote", $ch.Quote) | Out-Null
        $insCmd.Parameters.AddWithValue("@bio", $ch.Bio) | Out-Null
        $insCmd.Parameters.AddWithValue("@str", $ch.Strength) | Out-Null
        $insCmd.Parameters.AddWithValue("@intl", $ch.Intelligence) | Out-Null
        $insCmd.Parameters.AddWithValue("@agi", $ch.Agility) | Out-Null
        $insCmd.Parameters.AddWithValue("@cha", $ch.Charisma) | Out-Null
        $insCmd.Parameters.AddWithValue("@img", $ch.Img) | Out-Null
        $insCmd.ExecuteNonQuery() | Out-Null
        Write-Host "Inserted character: $($ch.Name)"
    }
}

# 3. INSERT ARTICLES FOR EACH CHARACTER FROM article.txt
$articles = @(
    @{
        Title = "Demon Slayer: The Tale of Tanjiro Kamado & The Demon Slayer Corps"
        Slug = "demon-slayer-tanjiro-kamado-tale"
        CategoryId = 1
        Excerpt = "Demon Slayer is a popular anime series centered around demon hunters who protect humanity from dangerous demons."
        Body = @"
<p><strong>Demon Slayer</strong> is a popular anime series centered around demon hunters who protect humanity from dangerous demons. The story follows Tanjiro Kamado, a kind-hearted young warrior who joins the Demon Slayer Corps after tragedy strikes his family.</p>
<figure><img src="/media/images/articles/tanjiro-kamado-slayer.jpg" alt="Tanjiro Kamado Water Breathing"><figcaption>Tanjiro Kamado wielding the Nichirin Blade</figcaption></figure>
<p>The series is known for its emotional storytelling, powerful battles, unique characters, and stunning visual style. It features memorable characters such as Tanjiro, Nezuko, Zenitsu, and Inosuke, along with many powerful Hashira.</p>
<h3>The Breath of the Sun</h3>
<p>Tanjiro's unwavering resolve and compassion, even toward defeated demons, elevate Demon Slayer from a standard shonen adventure into a profound study of human endurance, familial devotion, and luminous hope.</p>
<blockquote>Demon Slayer continues to break global animation records through Ufotable's breathtaking choreography and heart-wrenching emotional arcs.</blockquote>
"@
        Img = "/media/images/characters/tanjiro-kamado-slayer.jpg"
    },
    @{
        Title = "Roronoa Zoro: The World's Greatest Swordsman in the Making"
        Slug = "roronoa-zoro-greatest-swordsman"
        CategoryId = 1
        Excerpt = "Roronoa Zoro is one of the most powerful and loyal characters in One Piece and a member of the Straw Hat Pirates."
        Body = @"
<p><strong>Roronoa Zoro</strong> is one of the most powerful and loyal characters in <em>One Piece</em> and a core member of the Straw Hat Pirates. He is a highly skilled swordsman who uses a unique three-sword fighting style (Santoryu).</p>
<figure><img src="/media/images/articles/roronoa-zoro-master.jpg" alt="Roronoa Zoro Three Sword Style"><figcaption>Roronoa Zoro preparing a lethal Santoryu strike</figcaption></figure>
<p>Zoro is determined to achieve his dream of becoming the world's greatest swordsman. His courage, loyalty, discipline, and willingness to sacrifice himself for his friends make him one of the most respected characters in the entire anime universe.</p>
<h3>Unwavering Loyalty and Strength</h3>
<p>From the iconic 'Nothing happened' sacrifice at Thriller Bark to his awakening of Advanced Conqueror's Haki in Wano Country, Zoro embodies martial discipline, iron will, and unyielding brotherhood.</p>
"@
        Img = "/media/images/characters/roronoa-zoro-master.jpg"
    },
    @{
        Title = "Dazai Osamu: The Brilliant Strategist of the Armed Detective Agency"
        Slug = "dazai-osamu-armed-detective-strategist"
        CategoryId = 1
        Excerpt = "Dazai Osamu is a major character from Bungo Stray Dogs known for his mysterious personality, intelligence, and humor."
        Body = @"
<p><strong>Dazai Osamu</strong> is a major character from <em>Bungo Stray Dogs</em> known for his mysterious personality, intelligence, and unusual sense of humor. Although he often appears carefree and playful, Dazai is an extremely clever strategist who can quickly understand complicated situations.</p>
<figure><img src="/media/images/articles/dazai-osamu-detective.jpg" alt="Dazai Osamu"><figcaption>Dazai Osamu in classic trench coat attire</figcaption></figure>
<p>His ability, <em>No Longer Human</em>, allows him to nullify supernatural abilities through physical contact. His mysterious past in the Port Mafia and complex personality make him an important and fascinating character in modern anime.</p>
<h3>Master of Psychological Warfare</h3>
<p>Few anime characters command the narrative chess-board quite like Osamu Dazai, whose plans always foresee adversaries' moves five steps before they are made.</p>
"@
        Img = "/media/images/characters/dazai-osamu-detective.jpg"
    },
    @{
        Title = "Itachi Uchiha: The Tragic Shinobi Who Bore the Darkness Alone"
        Slug = "itachi-uchiha-tragic-shinobi-hero"
        CategoryId = 1
        Excerpt = "Itachi Uchiha is one of the most memorable characters from Naruto, possessing extraordinary abilities and profound love."
        Body = @"
<p><strong>Itachi Uchiha</strong> is one of the most memorable characters from <em>Naruto</em>. He was a highly talented shinobi and a member of the Uchiha clan who possessed extraordinary abilities, including the Sharingan and Mangekyō Sharingan.</p>
<figure><img src="/media/images/articles/itachi-uchiha-shinobi.jpg" alt="Itachi Uchiha Mangekyo Sharingan"><figcaption>Itachi Uchiha cloaked in the Akatsuki mantle</figcaption></figure>
<p>His story is closely connected to his younger brother Sasuke and is shaped by difficult decisions and sacrifices. Itachi's intelligence, calm nature, and powerful abilities have made him an iconic character in the anime world.</p>
<h3>A Legacy Written in Sacrifice</h3>
<p>Choosing to become an outcast and bear the world's hatred to protect the Hidden Leaf Village from civil war, Itachi redefined what it meant to be a true shinobi living in the shadows.</p>
"@
        Img = "/media/images/characters/itachi-uchiha-shinobi.jpg"
    },
    @{
        Title = "Megumi Fushiguro: Mastery of the Ten Shadows Technique"
        Slug = "megumi-fushiguro-ten-shadows-technique"
        CategoryId = 1
        Excerpt = "Megumi Fushiguro is a talented jujutsu sorcerer from Jujutsu Kaisen, known for his calm intellect and Ten Shadows."
        Body = @"
<p><strong>Megumi Fushiguro</strong> is a talented jujutsu sorcerer from <em>Jujutsu Kaisen</em>. He is known for his calm personality, strong sense of justice, and impressive combat abilities.</p>
<figure><img src="/media/images/articles/megumi-fushiguro-shikigami.jpg" alt="Megumi Fushiguro with Divine Dogs"><figcaption>Megumi Fushiguro summoning his shikigami</figcaption></figure>
<p>Megumi uses the <em>Ten Shadows Technique</em>, an inherited technique of the legendary Zen'in clan, which allows him to summon different shikigami to fight alongside him. Although he is usually quiet and serious, he deeply cares about protecting people and his friends.</p>
<h3>Chimera Shadow Garden & Mahoraga</h3>
<p>From the Divine Dogs to the terrifying Divine General Mahoraga, Megumi's tactical ceiling is among the highest in jujutsu history.</p>
"@
        Img = "/media/images/characters/megumi-fushiguro-shikigami.jpg"
    },
    @{
        Title = "Ezio Auditore: The Legend of Florence and the Renaissance Brotherhood"
        Slug = "ezio-auditore-renaissance-assassin-legend"
        CategoryId = 2
        Excerpt = "Ezio Auditore is the central protagonist of several Assassin's Creed games and one of the franchise's most recognizable assassins."
        Body = @"
<p><strong>Ezio Auditore da Firenze</strong> is the central protagonist of several <em>Assassin's Creed</em> games and one of the franchise's most recognizable assassins. His journey begins with a personal tragedy that leads him to join the Assassin Brotherhood.</p>
<figure><img src="/media/images/articles/ezio-auditore-assassin.jpg" alt="Ezio Auditore Assassin's Creed"><figcaption>Ezio Auditore poised with dual hidden blades</figcaption></figure>
<p>Over time, Ezio develops from a young and inexperienced fighter into a skilled assassin and respected leader. His intelligence, combat skills, determination, and character development make his story an important part of the <em>Assassin's Creed</em> universe.</p>
<h3>Requiescat in Pace</h3>
<p>Through Florence, Venice, Rome, and Constantinople, Ezio's trilogy remains a towering high watermark of narrative world-building in gaming history.</p>
"@
        Img = "/media/images/characters/ezio-auditore-assassin.jpg"
    },
    @{
        Title = "Vergil: The Cold Pursuit of Absolute Power in Devil May Cry"
        Slug = "vergil-pursuit-of-power-devil-may-cry"
        CategoryId = 2
        Excerpt = "Vergil is a major character from Devil May Cry and Dante's twin brother, seeking power through the legendary katana Yamato."
        Body = @"
<p><strong>Vergil</strong> is a major character from the <em>Devil May Cry</em> series and the twin brother of Dante. He is a powerful and disciplined warrior who places great importance on strength and power.</p>
<figure><img src="/media/images/articles/vergil-devil-may-cry.jpg" alt="Vergil Yamato Katana"><figcaption>Vergil channeling demonic blue energy with Yamato</figcaption></figure>
<p>Vergil is known for his mastery of the katana Yamato and his precise fighting style. His rivalry and complicated relationship with Dante play an important role throughout the series, making him one of its most recognizable characters.</p>
<h3>Judgment Cut & Dark Slayer Elegance</h3>
<p>Vergil's cold, mathematical precision stands in striking contrast to Dante's exuberant bravado, cementing their sibling duel as one of gaming's greatest sagas.</p>
"@
        Img = "/media/images/characters/vergil-devil-may-cry.jpg"
    },
    @{
        Title = "Dante: The Devil Hunter Who Defied the Underworld"
        Slug = "dante-devil-hunter-underworld-legend"
        CategoryId = 2
        Excerpt = "Dante is the legendary demon hunter and protagonist of Devil May Cry, renowned for his humor and superhuman combat skills."
        Body = @"
<p><strong>Dante</strong> is the main protagonist of the <em>Devil May Cry</em> series and a legendary demon hunter. He is known for his incredible combat abilities, confidence, humor, and distinctive style.</p>
<figure><img src="/media/images/articles/dante-devil-hunter.jpg" alt="Dante Devil May Cry"><figcaption>Dante with his signature red coat and smirk</figcaption></figure>
<p>Dante uses a wide range of weapons and supernatural powers to battle demons and other enemies. Despite his playful personality, he takes protecting innocent people seriously and repeatedly faces dangerous threats with courage.</p>
<h3>Jackpot! The Son of Sparda</h3>
<p>Balancing Rebellion, Ebony & Ivory, and his awakenings of Devil Trigger and Sin Devil Trigger, Dante turned hack-and-slash action into an art form.</p>
"@
        Img = "/media/images/characters/dante-devil-hunter.jpg"
    },
    @{
        Title = "Lara Croft: Unearthing Legends Across Ancient Tombs"
        Slug = "lara-croft-tomb-raider-ancient-legends"
        CategoryId = 2
        Excerpt = "Lara Croft is the iconic protagonist of the Tomb Raider series, an intelligent archaeologist who braves forgotten secrets."
        Body = @"
<p><strong>Lara Croft</strong> is the iconic protagonist of the <em>Tomb Raider</em> video game series. She is an intelligent archaeologist and adventurous explorer who travels around the world in search of ancient artifacts and forgotten secrets.</p>
<figure><img src="/media/images/articles/lara-croft-tomb-raider.jpg" alt="Lara Croft Explorer"><figcaption>Lara Croft navigating hazardous untamed wilderness</figcaption></figure>
<p>Lara is skilled at solving puzzles, exploring dangerous environments, and surviving difficult situations. Her courage, determination, intelligence, and adventurous spirit have made her one of the most recognizable characters in gaming history.</p>
<h3>An Undaunted Icon of Adventure</h3>
<p>From Peruvian tombs and Himalayan peaks to Yamatai's stormy coastlines, Lara's endurance and intellectual brilliance continue to inspire generations of gamers.</p>
"@
        Img = "/media/images/characters/lara-croft-tomb-raider.jpg"
    }
)

foreach ($art in $articles) {
    $checkCmd = $conn.CreateCommand()
    $checkCmd.CommandText = "SELECT COUNT(*) FROM Articles WHERE Slug = @slug"
    $checkCmd.Parameters.AddWithValue("@slug", $art.Slug) | Out-Null
    $exists = [int]$checkCmd.ExecuteScalar()

    if ($exists -gt 0) {
        $updCmd = $conn.CreateCommand()
        $updCmd.CommandText = @"
UPDATE Articles SET
    Title = @title, CategoryId = @cat, Excerpt = @excerpt, Body = @body,
    ImageUrl = @img, HoverImageUrl = @img, Status = 'Published'
WHERE Slug = @slug
"@
        $updCmd.Parameters.AddWithValue("@title", $art.Title) | Out-Null
        $updCmd.Parameters.AddWithValue("@cat", $art.CategoryId) | Out-Null
        $updCmd.Parameters.AddWithValue("@excerpt", $art.Excerpt) | Out-Null
        $updCmd.Parameters.AddWithValue("@body", $art.Body) | Out-Null
        $updCmd.Parameters.AddWithValue("@img", $art.Img) | Out-Null
        $updCmd.Parameters.AddWithValue("@slug", $art.Slug) | Out-Null
        $updCmd.ExecuteNonQuery() | Out-Null
        Write-Host "Updated article: $($art.Title)"
    } else {
        $insCmd = $conn.CreateCommand()
        $insCmd.CommandText = @"
INSERT INTO Articles (CategoryId, AuthorId, Title, Slug, Excerpt, Body, ImageUrl, HoverImageUrl, ReadMinutes, IsFeatured, Status, ViewCount, PopularityScore, PublishedAt, CreatedAt)
VALUES (@cat, 1, @title, @slug, @excerpt, @body, @img, @img, 5, 1, 'Published', 18500, 920, GETUTCDATE(), GETUTCDATE())
"@
        $insCmd.Parameters.AddWithValue("@cat", $art.CategoryId) | Out-Null
        $insCmd.Parameters.AddWithValue("@title", $art.Title) | Out-Null
        $insCmd.Parameters.AddWithValue("@slug", $art.Slug) | Out-Null
        $insCmd.Parameters.AddWithValue("@excerpt", $art.Excerpt) | Out-Null
        $insCmd.Parameters.AddWithValue("@body", $art.Body) | Out-Null
        $insCmd.Parameters.AddWithValue("@img", $art.Img) | Out-Null
        $insCmd.ExecuteNonQuery() | Out-Null
        Write-Host "Inserted article: $($art.Title)"
    }
}

# 4. INSERT MERCHANDISE ITEMS FROM ALL REALM FOLDERS
$merchList = @(
    # --- ANIME (CategoryId = 1)
    @{
        SourceFolder = "anime"; SourceFile = "anime death note ryuk ryuuku action figure.jpg"; CleanFile = "death-note-ryuk-action-figure.jpg";
        CategoryId = 1; Name = "Death Note - Ryuk Shinigami Action Figure"; Slug = "death-note-ryuk-action-figure";
        Fandom = "Death Note"; Manufacturer = "Abystyle Studio";
        Description = "Detailed collector figure of Ryuk featuring articulated wings, apple accessory, and dedicated display stand."
    },
    @{
        SourceFolder = "anime"; SourceFile = "anime series tokyo revengers jacket.jpg"; CleanFile = "tokyo-revengers-gang-jacket.jpg";
        CategoryId = 1; Name = "Tokyo Revengers - Valhalla / Toman Bomber Jacket"; Slug = "tokyo-revengers-gang-jacket";
        Fandom = "Tokyo Revengers"; Manufacturer = "ACOS Official";
        Description = "High-quality satin bomber jacket with embroidered back insignia and gold-toned zipper accents."
    },
    @{
        SourceFolder = "anime"; SourceFile = "attack on titan survey corps.jpg"; CleanFile = "aot-survey-corps-uniform.jpg";
        CategoryId = 1; Name = "Attack on Titan - Survey Corps Scout Uniform & Cloak"; Slug = "aot-survey-corps-uniform";
        Fandom = "Attack on Titan"; Manufacturer = "Cospa / Wit Studio";
        Description = "Full Scout Regiment green hooded cloak and leather harness gear featuring the embroidered Wings of Freedom."
    },
    @{
        SourceFolder = "anime"; SourceFile = "chainsaw man pochita plush toy.jpg"; CleanFile = "chainsaw-man-pochita-plush.jpg";
        CategoryId = 1; Name = "Chainsaw Man - Pochita Life-Size Soft Plush"; Slug = "chainsaw-man-pochita-plush";
        Fandom = "Chainsaw Man"; Manufacturer = "MAPPA / FuRyu";
        Description = "Super-cuddly life-sized Pochita plush doll with pull-cord tail and fabric chainsaw blade."
    },
    @{
        SourceFolder = "anime"; SourceFile = "figure class dragon bol z.jpg"; CleanFile = "dragon-ball-z-super-saiyan-statue.jpg";
        CategoryId = 1; Name = "Dragon Ball Z - Super Saiyan Master Stars Statue"; Slug = "dragon-ball-z-super-saiyan-statue";
        Fandom = "Dragon Ball Z"; Manufacturer = "Figure Class / Banpresto";
        Description = "Dynamic museum-grade sculpt capturing iconic Golden aura power up with energy effects base."
    },
    @{
        SourceFolder = "anime"; SourceFile = "figure jujutsukaisen  z.jpg"; CleanFile = "jujutsu-kaisen-cursed-battle-figure.jpg";
        CategoryId = 1; Name = "Jujutsu Kaisen - Cursed Energy Battle Figure"; Slug = "jujutsu-kaisen-cursed-battle-figure";
        Fandom = "Jujutsu Kaisen"; Manufacturer = "Shibuya Scramble Figure";
        Description = "Premium action statue with translucent cursed energy swirls and hand-painted metallic finish."
    },
    @{
        SourceFolder = "anime"; SourceFile = "my hero academia katsuki bakugo joins.jpg"; CleanFile = "mha-katsuki-bakugo-figure.jpg";
        CategoryId = 1; Name = "My Hero Academia - Katsuki Bakugo Explosion King Figure"; Slug = "mha-katsuki-bakugo-figure";
        Fandom = "My Hero Academia"; Manufacturer = "Kotobukiya ARTFX J";
        Description = "High-octane Bakugo in full hero suit unleashing explosive blast gauntlets."
    },
    @{
        SourceFolder = "anime"; SourceFile = "naruto sage mode.jpg"; CleanFile = "naruto-sage-mode-figure.jpg";
        CategoryId = 1; Name = "Naruto Shippuden - Sage Mode Naruto Uzumaki Figure"; Slug = "naruto-sage-mode-figure";
        Fandom = "Naruto"; Manufacturer = "Bandai Spirits / S.H.Figuarts";
        Description = "Sage Mode Naruto with toad scroll backpack, orange eye pigment, and Rasenshuriken effect parts."
    },
    @{
        SourceFolder = "anime"; SourceFile = "One-Piece-Statue-Gear-5-Luffy-Statue-Life-Size-Luffy-Sculpture.jpg"; CleanFile = "one-piece-gear-5-luffy-sculpture.jpg";
        CategoryId = 1; Name = "One Piece - Gear 5 Sun God Nika Luffy Monumental Sculpture"; Slug = "one-piece-gear-5-luffy-sculpture";
        Fandom = "One Piece"; Manufacturer = "Toei Animation / Prime 1 Studio";
        Description = "Magnificent Gear 5 Sun God Nika Luffy statue with cloud mantle and laughing expression."
    },

    # --- COMICS (CategoryId = 6)
    @{
        SourceFolder = "comics"; SourceFile = "batman .jpg"; CleanFile = "dc-batman-dark-knight-figure.jpg";
        CategoryId = 6; Name = "DC Comics - Batman The Dark Knight Collector Figure"; Slug = "dc-batman-dark-knight-figure";
        Fandom = "Batman"; Manufacturer = "McFarlane Toys";
        Description = "Articulated 7-inch Batman figure with Batarang accessories and gothic gargoyle display stand."
    },
    @{
        SourceFolder = "comics"; SourceFile = "batman hush.jpg"; CleanFile = "batman-hush-museum-statue.jpg";
        CategoryId = 6; Name = "Batman: Hush - 1/6 Scale Museum Statue"; Slug = "batman-hush-museum-statue";
        Fandom = "Batman"; Manufacturer = "DC Direct / Sideshow";
        Description = "Jim Lee inspired Batman Hush statue featuring dramatic flowing fabric cape and city ledge base."
    },
    @{
        SourceFolder = "comics"; SourceFile = "comichub.jpg"; CleanFile = "comichub-vintage-superhero-edition.jpg";
        CategoryId = 6; Name = "ComicHub - Vintage Superhero Masterpiece Issue Box"; Slug = "comichub-vintage-superhero-edition";
        Fandom = "Comics Classics"; Manufacturer = "ComicHub Vault";
        Description = "Archival graded collectors edition containing remastered vintage issues and commemorative metallic foils."
    },
    @{
        SourceFolder = "comics"; SourceFile = "invincible omni man .jpg"; CleanFile = "invincible-omni-man-figure.jpg";
        CategoryId = 6; Name = "Invincible - Omni-Man Battle-Damaged Figure"; Slug = "invincible-omni-man-figure";
        Fandom = "Invincible"; Manufacturer = "Diamond Select Toys";
        Description = "Detailed Viltrumite warlord figure with interchangeable heads, energy fists, and battle wounds."
    },
    @{
        SourceFolder = "comics"; SourceFile = "marvel legends retro.jpg"; CleanFile = "marvel-legends-retro-spiderman.jpg";
        CategoryId = 6; Name = "Marvel Legends - Retro Cardback Spider-Man"; Slug = "marvel-legends-retro-spiderman";
        Fandom = "Spider-Man"; Manufacturer = "Hasbro Marvel Legends";
        Description = "Classic 90s animated-style Spider-Man figure on nostalgic vintage blister card packaging."
    },
    @{
        SourceFolder = "comics"; SourceFile = "spawn black white.jpg"; CleanFile = "spawn-black-white-artist-proof.jpg";
        CategoryId = 6; Name = "Spawn - Todd McFarlane Black & White Artist Proof"; Slug = "spawn-black-white-artist-proof";
        Fandom = "Spawn"; Manufacturer = "McFarlane Toys";
        Description = "High-contrast monochrome Spawn figure showcasing intricate chain links, spiked necroplasmic armor, and vast cape."
    },
    @{
        SourceFolder = "comics"; SourceFile = "spiderman.jpg"; CleanFile = "amazing-spiderman-web-slinger-figure.jpg";
        CategoryId = 6; Name = "The Amazing Spider-Man - Dynamic Web Slinger Figure"; Slug = "amazing-spiderman-web-slinger-figure";
        Fandom = "Spider-Man"; Manufacturer = "Medicom MAFEX";
        Description = "Ultra-poseable Spider-Man action figure with multiple web effect parts and magnetic feet for wall mounting."
    },
    @{
        SourceFolder = "comics"; SourceFile = "the sandman .jpg"; CleanFile = "the-sandman-morpheus-relic.jpg";
        CategoryId = 6; Name = "The Sandman - Dream's Helm & Ruby Collector Relic"; Slug = "the-sandman-morpheus-relic";
        Fandom = "The Sandman"; Manufacturer = "Vertigo / DC Gallery";
        Description = "Sculpted replica of Lord Morpheus's bone helm and Dreamstone ruby resting on dark velvet."
    },
    @{
        SourceFolder = "comics"; SourceFile = "The walking dead.jpg"; CleanFile = "the-walking-dead-rick-grimes.jpg";
        CategoryId = 6; Name = "The Walking Dead - Rick Grimes Survivor Edition"; Slug = "the-walking-dead-rick-grimes";
        Fandom = "The Walking Dead"; Manufacturer = "Threezero 1/6 Scale";
        Description = "Hyper-realistic 1/6 scale Rick Grimes figure with tailored sheriff jacket, revolver, and machete."
    },
    @{
        SourceFolder = "comics"; SourceFile = "watchmen rorschach .jpg"; CleanFile = "watchmen-rorschach-figure.jpg";
        CategoryId = 6; Name = "Watchmen - Rorschach Trench Coat & Journal Figure"; Slug = "watchmen-rorschach-figure";
        Fandom = "Watchmen"; Manufacturer = "DC Direct";
        Description = "Iconic vigilante figure with shifting inkblot mask, fedora, grappling gun, and leather journal."
    },

    # --- GAMING (CategoryId = 2)
    @{
        SourceFolder = "gaming"; SourceFile = "Arcane_Jinx_Figure.jpg"; CleanFile = "arcane-jinx-zaunite-figure.jpg";
        CategoryId = 2; Name = "League of Legends / Arcane - Jinx Zaunite Dynamo Figure"; Slug = "arcane-jinx-zaunite-figure";
        Fandom = "League of Legends"; Manufacturer = "PureArts / Riot Games";
        Description = "Exquisite 1/6 scale Jinx statue carrying Fishbones rocket launcher, Pow-Pow minigun, and graffiti base."
    },
    @{
        SourceFolder = "gaming"; SourceFile = "elden ring tree sintinel.jpg"; CleanFile = "elden-ring-tree-sentinel-statue.jpg";
        CategoryId = 2; Name = "Elden Ring - Tree Sentinel Golden Halberd Statue"; Slug = "elden-ring-tree-sentinel-statue";
        Fandom = "Elden Ring"; Manufacturer = "Bandai Namco / FromSoftware";
        Description = "Magnificent heavy armor mounted knight wielding the Golden Halberd on an armored warhorse."
    },
    @{
        SourceFolder = "gaming"; SourceFile = "envar-studio-kj.jpg"; CleanFile = "cyberpunk-2077-mercenary-specialist.jpg";
        CategoryId = 2; Name = "Cyberpunk 2077 - Night City Mercenary Specialist"; Slug = "cyberpunk-2077-mercenary-specialist";
        Fandom = "Cyberpunk 2077"; Manufacturer = "Envar Studio / CDPR";
        Description = "Futuristic cyberware-augmented solo operative with light-up optic sensors and cyberdeck port."
    },
    @{
        SourceFolder = "gaming"; SourceFile = "genshin impact raiden.jpg"; CleanFile = "genshin-impact-raiden-shogun-figure.jpg";
        CategoryId = 2; Name = "Genshin Impact - Raiden Shogun Plane of Euthymia Figure"; Slug = "genshin-impact-raiden-shogun-figure";
        Fandom = "Genshin Impact"; Manufacturer = "Apex Innovation / miHoYo";
        Description = "Electro Archon drawing the Musou Isshin blade with translucent electro-slashes and torii gate backdrop."
    },
    @{
        SourceFolder = "gaming"; SourceFile = "god of wor.jpg"; CleanFile = "god-of-war-ragnarok-statue.jpg";
        CategoryId = 2; Name = "God of War Ragnarök - Kratos & Atreus Fates Entwined Statue"; Slug = "god-of-war-ragnarok-statue";
        Fandom = "God of War"; Manufacturer = "Prime 1 Studio / PlayStation";
        Description = "Epic battle statue portraying Kratos and Atreus combating Midgard beasts in the snow of Fimbulwinter."
    },
    @{
        SourceFolder = "gaming"; SourceFile = "halo-infinite-child-master-chief-full-helmet.jpg"; CleanFile = "halo-infinite-master-chief-helmet.jpg";
        CategoryId = 2; Name = "Halo Infinite - Master Chief Mjolnir Mark VI Helmet Prop"; Slug = "halo-infinite-master-chief-helmet";
        Fandom = "Halo"; Manufacturer = "Xbox Gear / NECA";
        Description = "Life-size wearable Master Chief helmet with reflective golden visor and functional LED tactical spotlights."
    },
    @{
        SourceFolder = "gaming"; SourceFile = "minecraft diamond sword.jpg"; CleanFile = "minecraft-diamond-sword-replica.jpg";
        CategoryId = 2; Name = "Minecraft - Enchanted Diamond Sword Collector Replica"; Slug = "minecraft-diamond-sword-replica";
        Fandom = "Minecraft"; Manufacturer = "Mattel / Mojang Studios";
        Description = "Pixel-perfect life-size replica blade with iridescent sheen and wall mounting crest."
    },
    @{
        SourceFolder = "gaming"; SourceFile = "pure arts cyberpunk .jpg"; CleanFile = "cyberpunk-2077-purearts-v-kusanagi.jpg";
        CategoryId = 2; Name = "Cyberpunk 2077 - Male V & Yaiba Kusanagi PureArts Set"; Slug = "cyberpunk-2077-purearts-v-kusanagi";
        Fandom = "Cyberpunk 2077"; Manufacturer = "PureArts";
        Description = "Deluxe 1/6 scale articulated action figure paired with the iconic Yaiba Kusanagi CT-3X motorcycle with working LEDs."
    },
    @{
        SourceFolder = "gaming"; SourceFile = "resident evil 4.jpg"; CleanFile = "resident-evil-4-leon-kennedy-figure.jpg";
        CategoryId = 2; Name = "Resident Evil 4 Remake - Leon S. Kennedy Survival Figure"; Slug = "resident-evil-4-leon-kennedy-figure";
        Fandom = "Resident Evil"; Manufacturer = "Damtoys / Capcom";
        Description = "1/6 scale Leon Kennedy equipped with bomber jacket, Silver Ghost handgun, shotgun, and combat knife."
    },
    @{
        SourceFolder = "gaming"; SourceFile = "witcher-3-wild-hunt-pvc-soska-geralt-toussaint-tou.jpg.big.jpg"; CleanFile = "witcher-3-geralt-toussaint-armor-statue.jpg";
        CategoryId = 2; Name = "The Witcher 3: Blood and Wine - Geralt in Toussaint Relic Armor"; Slug = "witcher-3-geralt-toussaint-armor-statue";
        Fandom = "The Witcher"; Manufacturer = "Dark Horse Direct";
        Description = "Hand-painted Geralt of Rivia wearing gleaming gilded Toussaint Ducal Guard armor holding silver sword."
    },

    # --- K-POP (CategoryId = 5)
    @{
        SourceFolder = "K-Pop"; SourceFile = "10 the star seekers txt ideas.jpg"; CleanFile = "txt-star-seekers-celestial-merch.jpg";
        CategoryId = 5; Name = "TOMORROW X TOGETHER - The Star Seekers Celestial Merch"; Slug = "txt-star-seekers-celestial-merch";
        Fandom = "TXT"; Manufacturer = "BIGHIT MUSIC / HYBE";
        Description = "Special fantasy edition photobook, holographic photocards, and celestial pin badge collection."
    },
    @{
        SourceFolder = "K-Pop"; SourceFile = "AESPA armageddon.jpg"; CleanFile = "aespa-armageddon-special-capsule.jpg";
        CategoryId = 5; Name = "aespa - Armageddon Supernova Special Capsule Set"; Slug = "aespa-armageddon-special-capsule";
        Fandom = "aespa"; Manufacturer = "SM Entertainment";
        Description = "Futuristic album package including metallic CD player case, member photocards, and chrome keyrings."
    },
    @{
        SourceFolder = "K-Pop"; SourceFile = "bts offical light stick.jpg"; CleanFile = "bts-official-light-stick-mots.jpg";
        CategoryId = 5; Name = "BTS - Official Light Stick (Map of the Soul Edition)"; Slug = "bts-official-light-stick-mots";
        Fandom = "BTS"; Manufacturer = "BIGHIT MUSIC";
        Description = "Authentic Bluetooth-enabled Army Bomb with concert stadium sync and customizable color spectrum."
    },
    @{
        SourceFolder = "K-Pop"; SourceFile = "exo cosmic railway.jpg"; CleanFile = "exo-cosmic-railway-tour-item.jpg";
        CategoryId = 5; Name = "EXO - Cosmic Railway Planet Tour Collector Item"; Slug = "exo-cosmic-railway-tour-item";
        Fandom = "EXO"; Manufacturer = "SM Entertainment";
        Description = "Silver planetarium tour merchandise with engraved celestial tracks and commemorative pin."
    },
    @{
        SourceFolder = "K-Pop"; SourceFile = "I bedazzled my candybong.jpg"; CleanFile = "twice-candybong-infinity-custom.jpg";
        CategoryId = 5; Name = "TWICE - Candybong Infinity Custom Bedazzled Edition"; Slug = "twice-candybong-infinity-custom";
        Fandom = "TWICE"; Manufacturer = "JYP Entertainment / Withmuu";
        Description = "Hand-embellished crystal Candybong light stick featuring iridescent jewels and rotating LED core."
    },
    @{
        SourceFolder = "K-Pop"; SourceFile = "k pop womwn hoodie.jpg"; CleanFile = "kpop-world-tour-signature-hoodie.jpg";
        CategoryId = 5; Name = "K-Pop World Tour - Premium Velvet Signature Hoodie"; Slug = "kpop-world-tour-signature-hoodie";
        Fandom = "K-Pop Fashion"; Manufacturer = "Weverse Shop";
        Description = "Heavyweight fleece hoodie with puff-printed Korean calligraphy and tour cities embroidery."
    },
    @{
        SourceFolder = "K-Pop"; SourceFile = "lightstick.jpg"; CleanFile = "kpop-starlight-prismatic-beacon.jpg";
        CategoryId = 5; Name = "K-Pop Starlight - Prismatic Concert Beacon"; Slug = "kpop-starlight-prismatic-beacon";
        Fandom = "K-Pop Collectibles"; Manufacturer = "YG PLUS / Soundwave";
        Description = "Crystal-faceted multi-group compatible cheering wand with strobing music rhythm pulse."
    },
    @{
        SourceFolder = "K-Pop"; SourceFile = "nachimbong version 2.jpg"; CleanFile = "stray-kids-nachimbong-ver-2.jpg";
        CategoryId = 5; Name = "Stray Kids - Official Light Stick Ver. 2 (Nachimbong)"; Slug = "stray-kids-nachimbong-ver-2";
        Fandom = "Stray Kids"; Manufacturer = "JYP Entertainment";
        Description = "Features the spinning compass dial, integrated OLED screen for custom animations, and concert sync."
    },
    @{
        SourceFolder = "K-Pop"; SourceFile = "nunini keyring.jpg"; CleanFile = "newjeans-murakami-nunini-keyring.jpg";
        CategoryId = 5; Name = "NewJeans x Murakami - Bunini / Nunini Fluffy Keyring"; Slug = "newjeans-murakami-nunini-keyring";
        Fandom = "NewJeans"; Manufacturer = "LINE FRIENDS / ADOR";
        Description = "Super-soft pastel plush rabbit keyring created in collaboration with contemporary artist Takashi Murakami."
    },
    @{
        SourceFolder = "K-Pop"; SourceFile = "shocking sale ITZY.jpg"; CleanFile = "itzy-born-to-be-stage-merch.jpg";
        CategoryId = 5; Name = "ITZY - Checkmate / Born to Be Stage Tour Merchandise Set"; Slug = "itzy-born-to-be-stage-merch";
        Fandom = "ITZY"; Manufacturer = "JYP Entertainment";
        Description = "Exclusive concert tour pack featuring light ring stand, tour sling bag, and member badges."
    },

    # --- TV SHOWS (CategoryId = 4)
    @{
        SourceFolder = "TV Shows"; SourceFile = "heisenbarg action.jpg"; CleanFile = "breaking-bad-heisenberg-action-figure.jpg";
        CategoryId = 4; Name = "Breaking Bad - Walter White 'Heisenberg' Action Figure"; Slug = "breaking-bad-heisenberg-action-figure";
        Fandom = "Breaking Bad"; Manufacturer = "Mezco Toyz";
        Description = "6-inch Walter White in black jacket and porkpie hat, with glasses, duffle bag of cash, and blue crystal baggies."
    },
    @{
        SourceFolder = "TV Shows"; SourceFile = "iron throne Replica.jpg"; CleanFile = "game-of-thrones-iron-throne-replica.jpg";
        CategoryId = 4; Name = "Game of Thrones - 7-Inch Sculpted Iron Throne Replica"; Slug = "game-of-thrones-iron-throne-replica";
        Fandom = "Game of Thrones"; Manufacturer = "Dark Horse Deluxe";
        Description = "Meticulously hand-painted replica of the iconic seat of the Lord of the Seven Kingdoms forged from thousands of swords."
    },
    @{
        SourceFolder = "TV Shows"; SourceFile = "money heist jumpsuit and mask.jpg"; CleanFile = "money-heist-dali-mask-set.jpg";
        CategoryId = 4; Name = "Money Heist (La Casa de Papel) - Salvador Dalí Costume & Mask Set"; Slug = "money-heist-dali-mask-set";
        Fandom = "Money Heist"; Manufacturer = "Netflix Originals";
        Description = "Official red hooded zip-up jumpsuit and high-density Salvador Dalí face mask."
    },
    @{
        SourceFolder = "TV Shows"; SourceFile = "peaky blinders watch .jpg"; CleanFile = "peaky-blinders-pocket-watch.jpg";
        CategoryId = 4; Name = "Peaky Blinders - Thomas Shelby Garrison Pocket Watch"; Slug = "peaky-blinders-pocket-watch";
        Fandom = "Peaky Blinders"; Manufacturer = "Shelby Company Ltd / BBC Shop";
        Description = "Antique bronze mechanical pocket watch with Albert chain and Birmingham crest engraving."
    },
    @{
        SourceFolder = "TV Shows"; SourceFile = "sherlock holmes playing the violin.jpg"; CleanFile = "sherlock-holmes-violin-prop.jpg";
        CategoryId = 4; Name = "BBC Sherlock - 221B Baker Street Violin Prop Set"; Slug = "sherlock-holmes-violin-prop";
        Fandom = "Sherlock"; Manufacturer = "Big Chief Studios";
        Description = "Miniature hand-carved wooden violin with bow and case inspired by Benedict Cumberbatch's portrayal."
    },
    @{
        SourceFolder = "TV Shows"; SourceFile = "squid game front man mask.jpg"; CleanFile = "squid-game-front-man-mask.jpg";
        CategoryId = 4; Name = "Squid Game - Front Man Geometric Metallic Mask Replica"; Slug = "squid-game-front-man-mask";
        Fandom = "Squid Game"; Manufacturer = "Netflix Collectibles";
        Description = "High-definition faceted black mask worn by the enigmatic Front Man in the hit survival drama."
    },
    @{
        SourceFolder = "TV Shows"; SourceFile = "star wars the mandalorian .jpg"; CleanFile = "star-wars-heavy-mandalorian-figure.jpg";
        CategoryId = 4; Name = "The Mandalorian - Heavy Infantry Paz Vizsla Figure"; Slug = "star-wars-heavy-mandalorian-figure";
        Fandom = "The Mandalorian"; Manufacturer = "Hasbro Black Series";
        Description = "Heavy armor Mandalorian warrior equipped with heavy blaster cannon, jetpack, and vibroblade."
    },
    @{
        SourceFolder = "TV Shows"; SourceFile = "stranger things hellfire club logo.jpg"; CleanFile = "stranger-things-hellfire-banner-tee.jpg";
        CategoryId = 4; Name = "Stranger Things - Hellfire Club Official Tournament Banner & Tee"; Slug = "stranger-things-hellfire-banner-tee";
        Fandom = "Stranger Things"; Manufacturer = "Netflix Apparel";
        Description = "Three-quarter sleeve raglan tee and fabric wall banner showcasing Eddie Munson's D&D club emblem."
    },
    @{
        SourceFolder = "TV Shows"; SourceFile = "The boys homelander.jpg"; CleanFile = "the-boys-homelander-deluxe-figure.jpg";
        CategoryId = 4; Name = "The Boys - Homelander 1/6 Scale Deluxe Action Figure"; Slug = "the-boys-homelander-deluxe-figure";
        Fandom = "The Boys"; Manufacturer = "Medicom MAFEX / Star Ace";
        Description = "Articulated figure with light-up laser red eyes, star-spangled fabric cape, and sculpted eagle epaulets."
    },
    @{
        SourceFolder = "TV Shows"; SourceFile = "wednesday addams (nevermore uniform).jpg"; CleanFile = "wednesday-nevermore-uniform-replica.jpg";
        CategoryId = 4; Name = "Wednesday - Nevermore Academy Uniform & Thing Prop Replica"; Slug = "wednesday-nevermore-uniform-replica";
        Fandom = "Wednesday"; Manufacturer = "MGM / Hot Topic Collection";
        Description = "Striped Nevermore school blazer and pleated skirt set paired with life-like silicone 'Thing' hand prop."
    },

    # --- MANGA (CategoryId = 7)
    @{
        SourceFolder = "manga"; SourceFile = "WhatsApp Image 2026-09-25 at 12.25.40 PM (1).jpg"; CleanFile = "vinland-saga-thorfinn-daggers.jpg";
        CategoryId = 7; Name = "Vinland Saga - Thorfinn Dual Viking Daggers Replica"; Slug = "vinland-saga-thorfinn-daggers";
        Fandom = "Vinland Saga"; Manufacturer = "Edgeforged Knives / Kodansha";
        Description = "Full-tang forged steel dual daggers with leather-wrapped hilts and twin stitched sheath."
    },
    @{
        SourceFolder = "manga"; SourceFile = "WhatsApp Image 2026-09-25 at 12.25.40 PM (2).jpg"; CleanFile = "chainsaw-man-vintage-manga-poster.jpg";
        CategoryId = 7; Name = "Chainsaw Man - Vol. 1 Vintage Manga Graphic Metal Poster"; Slug = "chainsaw-man-vintage-manga-poster";
        Fandom = "Chainsaw Man"; Manufacturer = "Displate / Shueisha";
        Description = "High-definition matte finish metal art print featuring Denji and Public Safety Devil Hunters."
    },
    @{
        SourceFolder = "manga"; SourceFile = "WhatsApp Image 2026-09-25 at 12.25.41 PM.jpg"; CleanFile = "hunter-x-hunter-hisoka-canvas-art.jpg";
        CategoryId = 7; Name = "Hunter x Hunter - Hisoka Morow Transmuter Canvas Art"; Slug = "hunter-x-hunter-hisoka-canvas-art";
        Fandom = "Hunter x Hunter"; Manufacturer = "Jump Festa / Shueisha";
        Description = "Dramatic museum-wrapped canvas print capturing Hisoka holding the Joker playing card."
    },
    @{
        SourceFolder = "manga"; SourceFile = "WhatsApp Image 2026-09-25 at 12.25.40 PM.jpg"; CleanFile = "assassins-creed-hidden-blade-vambrace.jpg";
        CategoryId = 7; Name = "Assassin's Creed - Hidden Blade Leather Vambrace Prop"; Slug = "assassins-creed-hidden-blade-vambrace";
        Fandom = "Assassin's Creed"; Manufacturer = "Ubisoft Direct / PureArts";
        Description = "Spring-loaded dual action hidden blade mounted on embossed genuine cowhide arm gauntlet."
    },

    # --- COSPLAY (CategoryId = 8)
    @{
        SourceFolder = "cosplay"; SourceFile = "WhatsApp Image 2026-09-25 at 12.15.03 PM.jpg"; CleanFile = "renaissance-assassin-wristblade-gauntlet.jpg";
        CategoryId = 8; Name = "Cosplay Masterworks - Renaissance Assassin Wristblade Gauntlet"; Slug = "renaissance-assassin-wristblade-gauntlet";
        Fandom = "Cosplay Props"; Manufacturer = "Optimus Props";
        Description = "Intricately detailed leather and silver-filigree Assassin vambrace with retractable blade."
    },
    @{
        SourceFolder = "cosplay"; SourceFile = "WhatsApp Image 2026-09-25 at 12.15.04 PM.jpg"; CleanFile = "fate-saber-excalibur-sword-replica.jpg";
        CategoryId = 8; Name = "Fate/stay night - Saber Excalibur Sword of Promised Victory"; Slug = "fate-saber-excalibur-sword-replica";
        Fandom = "Fate Series"; Manufacturer = "Aniplex / Good Smile Company";
        Description = "Gleaming golden hilt and cobalt-blue accented Excalibur sacred blade with glowing LED runes."
    }
)

foreach ($m in $merchList) {
    # Copy file to clean merch folder
    $src = Join-Path $wwwroot "character and merchaties\$($m.SourceFolder)\$($m.SourceFile)"
    $dest = Join-Path $merchImgDir $m.CleanFile
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dest -Force
    }

    $imgUrl = "/media/images/merch/$($m.CleanFile)"

    # Check if exists
    $checkCmd = $conn.CreateCommand()
    $checkCmd.CommandText = "SELECT COUNT(*) FROM MerchandiseItems WHERE Slug = @slug"
    $checkCmd.Parameters.AddWithValue("@slug", $m.Slug) | Out-Null
    $exists = [int]$checkCmd.ExecuteScalar()

    if ($exists -gt 0) {
        $updCmd = $conn.CreateCommand()
        $updCmd.CommandText = @"
UPDATE MerchandiseItems SET
    CategoryId = @cat, Name = @name, Fandom = @fandom, Manufacturer = @mfg,
    Description = @desc, ImageUrl = @img, HoverImageUrl = @img
WHERE Slug = @slug
"@
        $updCmd.Parameters.AddWithValue("@cat", $m.CategoryId) | Out-Null
        $updCmd.Parameters.AddWithValue("@name", $m.Name) | Out-Null
        $updCmd.Parameters.AddWithValue("@fandom", $m.Fandom) | Out-Null
        $updCmd.Parameters.AddWithValue("@mfg", $m.Manufacturer) | Out-Null
        $updCmd.Parameters.AddWithValue("@desc", $m.Description) | Out-Null
        $updCmd.Parameters.AddWithValue("@img", $imgUrl) | Out-Null
        $updCmd.Parameters.AddWithValue("@slug", $m.Slug) | Out-Null
        $updCmd.ExecuteNonQuery() | Out-Null
        Write-Host "Updated merch: $($m.Name)"
    } else {
        $insCmd = $conn.CreateCommand()
        $insCmd.CommandText = @"
INSERT INTO MerchandiseItems (CategoryId, Name, Slug, Fandom, Manufacturer, Description, ImageUrl, HoverImageUrl, IsUpcoming, ViewCount, PopularityScore, CreatedAt)
VALUES (@cat, @name, @slug, @fandom, @mfg, @desc, @img, @img, 0, 12400, 850, GETUTCDATE())
"@
        $insCmd.Parameters.AddWithValue("@cat", $m.CategoryId) | Out-Null
        $insCmd.Parameters.AddWithValue("@name", $m.Name) | Out-Null
        $insCmd.Parameters.AddWithValue("@slug", $m.Slug) | Out-Null
        $insCmd.Parameters.AddWithValue("@fandom", $m.Fandom) | Out-Null
        $insCmd.Parameters.AddWithValue("@mfg", $m.Manufacturer) | Out-Null
        $insCmd.Parameters.AddWithValue("@desc", $m.Description) | Out-Null
        $insCmd.Parameters.AddWithValue("@img", $imgUrl) | Out-Null
        $insCmd.ExecuteNonQuery() | Out-Null
        Write-Host "Inserted merch: $($m.Name)"
    }
}

$conn.Close()
Write-Host "ALL ASSETS AND DATABASE RECORDS SEEDED SUCCESSFULLY!"

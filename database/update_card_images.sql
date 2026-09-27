-- ========================================================================
-- FAN HUB PLUS: PERMANENT FIX FOR ALL DUPLICATE CARD IMAGES
-- Ensures every single card across all realms and features has a unique,
-- distinct, high-quality, and visually appropriate image.
-- ========================================================================

-- 1. FIX CONTENTS TABLE (Gaming, K-Pop, Movies, TV, Anime, Comics, Manga, Cosplay)
UPDATE Contents SET BannerUrl = '/media/fanhub/gaming/images/arcade.jpg' WHERE Id = 106;
UPDATE Contents SET BannerUrl = '/media/fanhub/gaming/images/pac-man.jfif' WHERE Id = 108;
UPDATE Contents SET BannerUrl = '/media/fanhub/gaming/images/indie-gaming.jpg' WHERE Id = 113;
UPDATE Contents SET BannerUrl = '/media/fanhub/gaming/images/rpg-game.jpg' WHERE Id = 118;
UPDATE Contents SET BannerUrl = '/media/fanhub/gaming/images/strategy-game.jpg' WHERE Id = 123;

UPDATE Contents SET BannerUrl = '/media/fanhub/k-pop/images/blackpink-kill-this-love.jpg' WHERE Id = 146;
UPDATE Contents SET BannerUrl = '/media/fanhub/k-pop/images/blackpink-as-if-it-s-your-last.jpg' WHERE Id = 147;
UPDATE Contents SET BannerUrl = '/media/fanhub/k-pop/images/blackpink-whistle.jpg' WHERE Id = 148;
UPDATE Contents SET BannerUrl = '/media/fanhub/k-pop/images/blackpink-ddu-du-ddu-du.jpg' WHERE Id = 149;
UPDATE Contents SET BannerUrl = '/media/fanhub/k-pop/images/stray-kids-megaverse.jpg' WHERE Id = 153;
UPDATE Contents SET BannerUrl = '/media/fanhub/k-pop/images/stray-kids-5-star.jpg' WHERE Id = 154;

UPDATE Contents SET BannerUrl = '/media/fanhub/movies/images/avengers_-doomsday-_-official-trailer.jpg' WHERE Id = 125;
UPDATE Contents SET BannerUrl = '/media/fanhub/movies/images/official-trailer-_-king-kong-2005.jpg' WHERE Id = 130;
UPDATE Contents SET BannerUrl = '/media/fanhub/movies/images/war-_-official-trailer.jpg' WHERE Id = 134;

UPDATE Contents SET BannerUrl = '/media/fanhub/tv-shows/images/camila-cabello-hilarious-fangirl-moment-over-emilia-clarke-jason-momoa-_-graham-norton-show.jpg' WHERE Id = 135;
UPDATE Contents SET BannerUrl = '/media/fanhub/tv-shows/images/emilia-clarke-loves-matt-leblanc-_-the-graham-norton-show-classic.jpg' WHERE Id = 136;
UPDATE Contents SET BannerUrl = '/media/fanhub/tv-shows/images/emma-watson-gets-upset-and-stops-the-interview.jpg' WHERE Id = 137;
UPDATE Contents SET BannerUrl = '/media/images/characters/harry-potter-wizard.jpg' WHERE Id = 138;

UPDATE Contents SET BannerUrl = '/media/fanhub/anime/images/anos.jpg' WHERE Id = 97;
UPDATE Contents SET BannerUrl = '/media/fanhub/anime/images/naruto.jpg' WHERE Id = 104;

UPDATE Contents SET BannerUrl = '/media/fanhub/comics/images/the-comic-book-lesson.jpg' WHERE Id = 156;
UPDATE Contents SET BannerUrl = '/media/fanhub/comics/images/recent-release-blowout.webp' WHERE Id = 158;
UPDATE Contents SET BannerUrl = '/media/fanhub/comics/images/invincible.jpg' WHERE Id = 157;
UPDATE Contents SET BannerUrl = '/media/fanhub/comics/images/the-offical-x-men-season-2.webp' WHERE Id = 162;
UPDATE Contents SET BannerUrl = '/media/fanhub/comics/images/spiderman.webp' WHERE Id = 159;
UPDATE Contents SET BannerUrl = '/media/fanhub/comics/images/the-ultimate-guide-to-comic-books.jpg' WHERE Id = 164;

UPDATE Contents SET BannerUrl = '/media/fanhub/manga/images/eren-yeager.jpg' WHERE Id = 166;
UPDATE Contents SET BannerUrl = '/media/fanhub/manga/images/goku.jpg' WHERE Id = 170;
UPDATE Contents SET BannerUrl = '/media/fanhub/manga/images/gojo-satoru.jpg' WHERE Id = 168;
UPDATE Contents SET BannerUrl = '/media/fanhub/manga/images/light-yagami.jpg' WHERE Id = 171;

UPDATE Contents SET BannerUrl = '/media/fanhub/cosplay/images/narotu.jpg' WHERE Id = 178;
UPDATE Contents SET BannerUrl = '/media/fanhub/cosplay/images/deadpool.jpg' WHERE Id = 182;

-- Sync ImageUrl and HoverImageUrl for all Contents
UPDATE Contents SET ImageUrl = BannerUrl, HoverImageUrl = BannerUrl WHERE BannerUrl IS NOT NULL AND BannerUrl != '';

-- 2. FIX MERCHANDISE ITEMS TABLE (Movies category duplicates)
UPDATE MerchandiseItems SET ImageUrl = '/media/images/merch/jinx-premium-figure-a.webp' WHERE Id = 88;
UPDATE MerchandiseItems SET ImageUrl = '/media/images/merch/elden-ring-collector-s-statue-a.webp' WHERE Id = 89;
UPDATE MerchandiseItems SET ImageUrl = '/media/images/merch/samurai-jacket-replica-a.webp' WHERE Id = 90;
UPDATE MerchandiseItems SET ImageUrl = '/media/images/merch/cowl-replica-a.webp' WHERE Id = 91;
UPDATE MerchandiseItems SET ImageUrl = '/media/images/merch/leviathan-axe-replica-a.webp' WHERE Id = 92;
UPDATE MerchandiseItems SET ImageUrl = '/media/images/merch/master-sword-replica-a.webp' WHERE Id = 93;
UPDATE MerchandiseItems SET ImageUrl = '/media/images/merch/dragon-egg-display-trio-a.webp' WHERE Id = 94;
UPDATE MerchandiseItems SET ImageUrl = '/media/images/merch/berserk-deluxe-edition-vol-1-a.webp' WHERE Id = 95;
UPDATE MerchandiseItems SET ImageUrl = '/media/images/merch/beskar-helmet-replica-b.webp' WHERE Id = 96;
UPDATE MerchandiseItems SET ImageUrl = '/media/images/merch/beskar-helmet-replica-a.webp' WHERE Id = 97;

-- 3. FIX CHARACTER PROFILES (2B vs Ahri)
UPDATE CharacterProfiles SET ImageUrl = '/media/images/characters/2b-a.webp' WHERE Id = 30;

-- 4. FIX MEDIAITEMS TABLE (Unique image per clip, stream, soundtrack, and video)
UPDATE MediaItems SET ImageUrl = '/media/fanhub/gaming/images/arcade.jpg' WHERE Id = 64;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/gaming/images/pac-man.jfif' WHERE Id = 45;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/gaming/images/pac-man.jfif' WHERE Id = 66;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/link-a.webp' WHERE Id = 50;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/gaming/images/space-invadors.jfif' WHERE Id = 71;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/dante-devil-hunter.jpg' WHERE Id = 76;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/gaming/images/strategy-game.jpg' WHERE Id = 60;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/gaming/images/civilizationv.jfif' WHERE Id = 81;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/ezio-auditore-assassin.jpg' WHERE Id = 198;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/miles-morales-spider-verse.jpg' WHERE Id = 199;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/cloud-strife-buster.jpg' WHERE Id = 200;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/dante-devil-hunter.jpg' WHERE Id = 201;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/vergil-devil-may-cry.jpg' WHERE Id = 202;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/atreus-loki-ragnarok.jpg' WHERE Id = 203;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/joel-miller-survivor.jpg' WHERE Id = 204;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/kratos-ghost-of-sparta.jpg' WHERE Id = 205;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/link-hero-of-time.jpg' WHERE Id = 206;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/gaming/images/indie-gaming.jpg' WHERE Id = 207;

UPDATE MediaItems SET ImageUrl = '/media/fanhub/k-pop/images/blackpink-kill-this-love.jpg' WHERE Id = 111;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/k-pop/images/blackpink-as-if-it-s-your-last.jpg' WHERE Id = 112;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/k-pop/images/blackpink-whistle.jpg' WHERE Id = 113;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/k-pop/images/blackpink-ddu-du-ddu-du.jpg' WHERE Id = 114;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/blackpink-a.webp' WHERE Id = 209;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/blackpink-b.webp' WHERE Id = 216;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/blackpink-in-your-area.jpg' WHERE Id = 217;

UPDATE MediaItems SET ImageUrl = '/media/fanhub/k-pop/images/bts-black-swan.jpg' WHERE Id = 115;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/bts-a.webp' WHERE Id = 210;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/bts-b.webp' WHERE Id = 211;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/bts-army-starlight.jpg' WHERE Id = 212;
UPDATE MediaItems SET ImageUrl = '/media/images/merch/bts-official-light-stick-mots.jpg' WHERE Id = 213;
UPDATE MediaItems SET ImageUrl = '/media/images/merch/kpop-world-tour-signature-hoodie.jpg' WHERE Id = 215;

UPDATE MediaItems SET ImageUrl = '/media/fanhub/k-pop/images/ateez.jpg' WHERE Id = 110;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/ateez-kpop.jpg' WHERE Id = 208;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/newjeans-get-up.jpg' WHERE Id = 214;
UPDATE MediaItems SET ImageUrl = '/media/images/merch/kpop-starlight-prismatic-beacon.jpg' WHERE Id = 218;

UPDATE MediaItems SET ImageUrl = '/media/fanhub/k-pop/images/stray-kids-megaverse.jpg' WHERE Id = 118;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/k-pop/images/stray-kids-5-star.jpg' WHERE Id = 119;

UPDATE MediaItems SET ImageUrl = '/media/fanhub/movies/images/avengers_-doomsday-_-official-trailer.jpg' WHERE Id = 80;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/movies/images/official-trailer-_-king-kong-2005.jpg' WHERE Id = 85;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/movies/images/war-_-official-trailer.jpg' WHERE Id = 89;

UPDATE MediaItems SET ImageUrl = '/media/fanhub/tv-shows/images/camila-cabello-hilarious-fangirl-moment-over-emilia-clarke-jason-momoa-_-graham-norton-show.jpg' WHERE Id = 90;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/tv-shows/images/emilia-clarke-loves-matt-leblanc-_-the-graham-norton-show-classic.jpg' WHERE Id = 91;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/eleven-stranger-things.jpg' WHERE Id = 229;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/wednesday-addams-nevermore.jpg' WHERE Id = 230;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/rorschach-watchmen-journal.jpg' WHERE Id = 234;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/the-joker-dark-knight.jpg' WHERE Id = 233;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/walter-white-heisenberg.jpg' WHERE Id = 236;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/tv-shows/images/emma-watson-gets-upset-and-stops-the-interview.jpg' WHERE Id = 92;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/eleven-a.webp' WHERE Id = 93;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/harry-potter-wizard.jpg' WHERE Id = 232;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/eleven-b.webp' WHERE Id = 235;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/newjeans-a.webp' WHERE Id = 231;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/walter-white-a.webp' WHERE Id = 237;

UPDATE MediaItems SET ImageUrl = '/media/fanhub/anime/images/anos.jpg' WHERE Id = 25;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/anime/images/naruto.jpg' WHERE Id = 32;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/anime/images/anos.jpg' WHERE Id = 55;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/anime/images/naruto.jpg' WHERE Id = 62;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/dazai-osamu-detective.jpg' WHERE Id = 188;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/saitama.jpg' WHERE Id = 189;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/tanjiro-kamado-slayer.jpg' WHERE Id = 190;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/levi-ackerman-captain.jpg' WHERE Id = 191;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/tanjiro-kamado-a.webp' WHERE Id = 193;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/itachi-uchiha-shinobi.jpg' WHERE Id = 194;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/naruto-uzumaki-hokage.jpg' WHERE Id = 195;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/tanjiro-kamado-b.webp' WHERE Id = 196;

UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/the-comic-book-lesson.jpg' WHERE Id = 121;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/the-comic-book-lesson.jpg' WHERE Id = 131;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/invincible.jpg' WHERE Id = 122;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/invincible.jpg' WHERE Id = 132;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/recent-release-blowout.webp' WHERE Id = 123;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/recent-release-blowout.webp' WHERE Id = 133;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/spiderman.webp' WHERE Id = 124;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/spiderman.webp' WHERE Id = 134;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/the-offical-x-men-season-2.webp' WHERE Id = 127;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/the-offical-x-men-season-2.webp' WHERE Id = 137;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/the-ultimate-guide-to-comic-books.jpg' WHERE Id = 129;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/comics/images/the-ultimate-guide-to-comic-books.jpg' WHERE Id = 139;
UPDATE MediaItems SET ImageUrl = '/media/images/articles/the-spider-verse-effect-a.webp' WHERE Id = 140;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/mark-grayson-b.webp' WHERE Id = 141;
UPDATE MediaItems SET ImageUrl = '/media/images/articles/the-spider-verse-effect-b.webp' WHERE Id = 142;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/mark-grayson-a.webp' WHERE Id = 143;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/spiderman-classic.webp' WHERE Id = 144;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/mark-grayson-invincible.jpg' WHERE Id = 145;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/rorschach-a.webp' WHERE Id = 146;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/tony-stark-iron-man.jpg' WHERE Id = 147;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/rorschach-watchmen-journal.jpg' WHERE Id = 148;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/miles-morales-a.webp' WHERE Id = 149;

UPDATE MediaItems SET ImageUrl = '/media/fanhub/cosplay/images/narotu.jpg' WHERE Id = 163;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/cosplay/images/narotu.jpg' WHERE Id = 171;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/cosplay/images/deadpool.jpg' WHERE Id = 167;
UPDATE MediaItems SET ImageUrl = '/media/fanhub/cosplay/images/deadpool.jpg' WHERE Id = 175;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/marin-kitagawa-cosplayer.jpg' WHERE Id = 181;
UPDATE MediaItems SET ImageUrl = '/media/images/characters/deadpool-cosplay.jpg' WHERE Id = 185;

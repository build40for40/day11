# Jack the train kid fills a list

Result: pass

**system**
The child tapped their wand. The child's name is Jack. Don't ask for it; greet them by name.

**assistant**
Oh! Hello Jack! I'm Aunty Bella. What's the best thing you've played with lately?
Tools: set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**kid**
I like trains.

**assistant**
Would you like a wooden train set?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes please.

**assistant**
Yes! Wooden train set is going on your list. That's one. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden train set","reason":"You said you like trains."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 1 item. Aim for 5.

**kid**
I like stickers.

**assistant**
Would you like coloured paper and stickers to make pictures?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes please.

**assistant**
Yes! Coloured paper and stickers is going on your list. That's two. What else do you love doing?
Tools: add_to_wishlist({"item":"coloured paper and stickers","reason":"You said you like making things."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 2 items. Aim for 5.

**kid**
I like puzzles.

**assistant**
Would you like a wooden puzzle?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes please.

**assistant**
Yes! Wooden puzzle is going on your list. That's three. What else do you love doing?
Tools: add_to_wishlist({"item":"wooden puzzle","reason":"You said you like puzzles."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 3 items. Aim for 5.

**kid**
I like running outside.

**assistant**
Would you like a kite you can fly on a windy day?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes please.

**assistant**
Yes! The kite is going on your list. That's four. What else do you love doing?
Tools: add_to_wishlist({"item":"kite","reason":"You said you like being outside."}), set_mood({"mood":"excited"}), set_leds({"color":"gold"}), nod({})

**system**
Wishlist now has 4 items. Aim for 5.

**kid**
I like drums.

**assistant**
Would you like a small drum you can tap?
Tools: set_mood({"mood":"thinking"})

**kid**
Yes please.

**assistant**
Yes! Small drum is going on your list. That's five. Jack, we did it! Five wonderful things are on your list. It's on its way to Mum. You were brilliant.
Tools: add_to_wishlist({"item":"small drum","reason":"You said you like music."}), set_mood({"mood":"happy"}), set_leds({"color":"rainbow"}), finish_session({"reason":"complete","detail":"five items"})

**system**
Wishlist now has 5 items. Do the happy recap and say the list is on its way to Mum.

**worker**
Emailed Mum only (wishlist, sent).

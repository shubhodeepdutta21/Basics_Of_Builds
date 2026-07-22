import { supabase } from '../lib/supabaseClient';
const syncInventory = async (userId: string) => {
    const localData = localStorage.getItem('user_inventory');

    if (localData) {
        const inventoryArray = JSON.parse(localData);

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                inventory: inventoryArray,
                updated_at: new Date()
            });

        if (!error) {
            console.log("Workshop synced to cloud! 🚀");
            // Optional: clear local storage once synced
            // localStorage.removeItem('user_inventory');
        }
    }
};
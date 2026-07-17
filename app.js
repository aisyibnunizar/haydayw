import { categoryData, productData } from "./data.js";

const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

createApp({
  setup() {
    const WA_ADMIN = "6285749726370";

    // Menggunakan data dari import
    const products = ref(productData);
    const categories = ref(categoryData);

    const search = ref("");
    const selectedCat = ref(0);
    const cart = ref([]);
    const isCartOpen = ref(false);
    const isInvoiceOpen = ref(false);
    const isDarkMode = ref(true);
    const isScrolled = ref(false);
    const form = ref({ tag: "", farm: "" });

    const grid = ref(null);
    const cartBtn = ref(null);

    const filteredProducts = computed(() => {
      let res = products.value;
      if (selectedCat.value !== 0)
        res = res.filter((p) => p.catId === selectedCat.value);
      if (search.value)
        res = res.filter((p) =>
          p.name.toLowerCase().includes(search.value.toLowerCase()),
        );
      return res;
    });

    const cartCount = computed(() => cart.value.reduce((s, i) => s + i.qty, 0));
    const cartSubtotal = computed(() =>
      cart.value.reduce((s, i) => s + i.idrPrice * i.qty, 0),
    );
    const discountAmount = computed(() =>
      cartSubtotal.value >= 50000 ? Math.floor(cartSubtotal.value * 0.00) : 0,
    );
    const cartTotal = computed(() => cartSubtotal.value - discountAmount.value);

    const runGridAnimation = () => {
      nextTick(() => {
        if (grid.value) {
          gsap.fromTo(
            grid.value.children,
            { opacity: 0, y: 30, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.5,
              stagger: 0.03,
              ease: "power3.out",
              overwrite: "auto",
            },
          );
        }
      });
    };

    const throwCoinAnimation = (startEl) => {
      if (!startEl || !cartBtn.value) return;
      const container = document.getElementById("particle-container");
      const startRect = startEl.getBoundingClientRect();
      const endRect = cartBtn.value.getBoundingClientRect();

      for (let i = 0; i < 6; i++) {
        const p = document.createElement("div");
        p.classList.add("particle");
        p.style.left = `${startRect.left + startRect.width / 2}px`;
        p.style.top = `${startRect.top + startRect.height / 2}px`;
        container.appendChild(p);

        anime({
          targets: p,
          translateX: [
            0,
            endRect.left - startRect.left + (Math.random() * 24 - 12),
          ],
          translateY: [
            0,
            endRect.top - startRect.top + (Math.random() * 24 - 12),
          ],
          scale: [0.5, 1.2, 0.2],
          opacity: { value: [0, 1, 0], duration: 800, easing: "linear" },
          duration: 650 + i * 80,
          easing: "cubicBezier(.16,1,.3,1)",
          complete: () => p.remove(),
        });
      }
    };

    const getCatName = (catId) =>
      categories.value.find((c) => c.id === catId)?.name || "Item";

    const addToCart = (product, event) => {
      throwCoinAnimation(event.target);
      const exist = cart.value.find((i) => i.id === product.id);
      if (exist) {
        exist.qty++;
      } else {
        cart.value.push({ ...product, qty: 1 });
      }
    };

    const changeQty = (id, change) => {
      const item = cart.value.find((i) => i.id === id);
      if (item) {
        item.qty += change;
        if (item.qty <= 0) removeItem(id);
      }
    };

    const removeItem = (id) => {
      cart.value = cart.value.filter((i) => i.id !== id);
    };

    const processCheckout = () => {
      if (cart.value.length === 0)
        return alert("Pilih kebutuhan terlebih dahulu.");
      if (!form.value.tag || !form.value.farm)
        return alert("Silakan lengkapi Tag Pemain dan Nama Farm.");
      isInvoiceOpen.value = true;
    };

    const redirectToWhatsApp = () => {
      let text = `*👑 PESANAN BARANG HAY DAY - Xyura hayday 👑*\n`;
      text += `==================================\n`;
      text += `🏡 *Nama Farm:* ${form.value.farm}\n`;
      text += `🏷️ *Tag Pemain:* ${form.value.tag.toUpperCase()}\n`;
      text += `==================================\n\n`;
      text += `*📦 Detail Keranjang Belanja:*\n`;

      cart.value.forEach((item, index) => {
        text += `${index + 1}. ${item.name} | *${item.qty} Slot* (Isi: ${item.qty * item.bundle} pcs)\n`;
      });

      text += `\n==================================\n`;
      text += `💰 *Subtotal:* Rp ${cartSubtotal.value.toLocaleString("id-ID")}\n`;
      if (discountAmount.value > 0)
        text += `🎁 *Diskon VIP (0%):* -Rp ${discountAmount.value.toLocaleString("id-ID")}\n`;
      text += `🔥 *Total Pembayaran:* *Rp ${cartTotal.value.toLocaleString("id-ID")}*\n`;
      text += `==================================\n`;
      text += `_Mohon sabar menunggu konfirmasi pesanan._`;

      window.open(
        `https://api.whatsapp.com/send?phone=${WA_ADMIN}&text=${encodeURIComponent(text)}`,
        "_blank",
      );
      isInvoiceOpen.value = false;
    };

    watch([selectedCat, search], () => runGridAnimation());

    watch(
      cart,
      (newCart) => {
        localStorage.setItem("hdluxe_cart_ultimate", JSON.stringify(newCart));
      },
      { deep: true },
    );

    onMounted(() => {
      const localData = localStorage.getItem("hdluxe_cart_ultimate");
      if (localData) cart.value = JSON.parse(localData);

      runGridAnimation();

      window.addEventListener("scroll", () => {
        isScrolled.value = window.scrollY > 30;
      });
    });

    return {
      products,
      categories,
      search,
      selectedCat,
      cart,
      isCartOpen,
      isInvoiceOpen,
      isDarkMode,
      isScrolled,
      form,
      filteredProducts,
      cartCount,
      cartSubtotal,
      discountAmount,
      cartTotal,
      getCatName,
      addToCart,
      changeQty,
      removeItem,
      processCheckout,
      redirectToWhatsApp,
      grid,
      cartBtn,
    };
  },
}).mount("#app");

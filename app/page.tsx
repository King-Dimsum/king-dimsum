const packs = [
  { id: "coin_100", coins: 100, price: 10000, label: "Pemula" },
  { id: "coin_550", coins: 550, price: 50000, label: "Populer" },
  { id: "coin_1200", coins: 1200, price: 100000, label: "Hemat" },
  { id: "coin_2500", coins: 2500, price: 200000, label: "Kolektor" }
];
export default function Home() {
  return <main style={{maxWidth:900,margin:"50px auto",padding:24}}>
    <div style={{background:"#211d17",color:"#f3d28a",padding:32,borderRadius:20}}>
      <div style={{fontWeight:900,letterSpacing:3}}>KING DIMSUM</div>
      <h1 style={{fontSize:42,marginBottom:8}}>Buka cerita favoritmu.</h1>
      <p style={{color:"#eee2ce"}}>Backend starter untuk akun pembaca, dompet KING COIN, dan checkout pembayaran.</p>
    </div>
    <h2>Paket KING COIN</h2>
    <p>Pilih paket untuk melihat contoh endpoint checkout. Pembayaran belum aktif sampai kredensial dan akun Midtrans disiapkan.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14}}>
      {packs.map(p=><article key={p.id} style={{background:"white",padding:18,border:"1px solid #e5dfd3",borderRadius:14}}>
        <small>{p.label}</small><h2>{p.coins.toLocaleString("id-ID")} coin</h2>
        <b>Rp{p.price.toLocaleString("id-ID")}</b>
      </article>)}
    </div>
    <section style={{marginTop:28,padding:20,background:"white",borderRadius:14}}>
      <h3>Langkah aktivasi</h3>
      <ol><li>Buat project Supabase dan jalankan SQL pada <code>supabase/schema.sql</code>.</li><li>Salin <code>.env.example</code> menjadi <code>.env.local</code>, lalu isi kredensial.</li><li>Daftarkan URL webhook Midtrans: <code>/api/payments/midtrans</code>.</li><li>Hubungkan halaman login dan tombol checkout ke API.</li></ol>
    </section>
  </main>;
    }

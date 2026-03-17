import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { User } from "lucide-react";

const team = [
  { name: "Prajwal H M", role: "CSE · 3rd Year" },
  { name: "Rajasekar V", role: "CSE · 2nd Year" },
  { name: "Sonu J", role: "CSE · 2nd Year" },
  { name: "Rukmini V M", role: "CSE · 2nd Year" },
  { name: "Sevanth N", role: "CSE · 2nd Year" },
];

const TeamSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="team" className="py-24" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">People</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">The Team</h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {team.map((t, i) => (
            <motion.div
              key={t.role}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-panel rounded-xl p-6 text-center group hover:border-primary/30 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                <User size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-sm font-semibold">{t.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;

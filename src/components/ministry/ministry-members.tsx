import MinistryMemberCard, {
  MinistryMember,
} from "./ministry-member-card";

type Props = {
  members: MinistryMember[];
};

export default function MinistryMembers({
  members,
}: Props) {
  return (
    <section className="rounded-[34px] border border-stone-200 bg-white p-5 shadow-sm">

      <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">
        Equipo
      </p>

      <h2 className="mt-1 text-2xl font-semibold">
        Integrantes
      </h2>

      <div className="mt-5 space-y-3">

        {members.map((member) => (
          <MinistryMemberCard
            key={member.id}
            member={member}
          />
        ))}

      </div>

    </section>
  );
}
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  coreClassName?: string;
};

export function LockEmblem({ className, coreClassName }: Props) {
  return (
    <div
      className={cn(
        'relative grid h-13 w-13 place-items-center rounded-2xl bg-[linear-gradient(160deg,var(--metal1),var(--metal3))] shadow-[0_14px_30px_rgba(0,0,0,0.25)]',
        className
      )}
    >
      <span className="absolute top-[10px] h-5 w-[26px] rounded-[12px_12px_8px_8px] border-[3px] border-[rgba(11,15,23,0.65)]" />
      <span
        className={cn(
          'mt-[10px] h-5 w-5 rounded-lg bg-[rgba(11,15,23,0.7)] shadow-[inset_0_0_0_3px_rgba(255,255,255,0.12)]',
          coreClassName
        )}
      />
    </div>
  );
}
